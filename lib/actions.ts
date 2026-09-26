"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSession, destroySession, requireCurrentUser, verifyPassword } from "./auth";
import { createLead, isLeadStatus, leadSchema } from "./leads";
import { prisma } from "./prisma";
import { checkRateLimit, getClientIp, resetRateLimit } from "./rate-limit";
import { moveTempImages } from "./storage";
import { parseImagesText, propertySchema } from "./validations";

export type ActionState = {
  success?: boolean;
  message?: string;
  errors?: Record<string, string[]>;
  /** Valores enviados, para repreencher o formulário quando há erro. */
  values?: Record<string, string>;
};

function formDataToPayload(formData: FormData) {
  return {
    title: formData.get("title"),
    description: formData.get("description"),
    price: formData.get("price"),
    type: formData.get("type"),
    transactionType: formData.get("transactionType"),
    bedrooms: formData.get("bedrooms"),
    bathrooms: formData.get("bathrooms"),
    area: formData.get("area"),
    city: formData.get("city"),
    neighborhood: formData.get("neighborhood"),
    address: formData.get("address"),
    featured: formData.get("featured") === "on" || formData.get("featured") === "true",
    status: formData.get("status") || undefined,
    condoFee: formData.get("condoFee"),
    iptu: formData.get("iptu"),
    parkingSpaces: formData.get("parkingSpaces") || 0,
    furnished: formData.get("furnished") === "on",
    petFriendly: formData.get("petFriendly") === "on",
    amenities: formData.getAll("amenities").map(String),
    images: parseImagesText(String(formData.get("imagesText") ?? ""))
  };
}

function refreshPropertyPages() {
  revalidatePath("/");
  revalidatePath("/imoveis");
  revalidatePath("/admin", "layout");
}

export async function createPropertyAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  await requireCurrentUser();

  const parsed = propertySchema.safeParse(formDataToPayload(formData));

  if (!parsed.success) {
    return {
      success: false,
      message: "Revise os campos do formulário.",
      errors: parsed.error.flatten().fieldErrors
    };
  }

  const property = await prisma.property.create({ data: parsed.data });
  // Imagens enviadas antes de o imóvel existir ficam em _temp; agora vão para a pasta dele.
  const images = await moveTempImages(parsed.data.images, property.id);
  if (images.some((image, index) => image !== parsed.data.images[index])) {
    await prisma.property.update({ where: { id: property.id }, data: { images } });
  }
  refreshPropertyPages();
  redirect(`/admin/imoveis/${property.id}/editar?created=1`);
}

export async function updatePropertyAction(id: string, _prevState: ActionState, formData: FormData): Promise<ActionState> {
  await requireCurrentUser(`/admin/imoveis/${id}/editar`);

  const parsed = propertySchema.safeParse(formDataToPayload(formData));

  if (!parsed.success) {
    return {
      success: false,
      message: "Revise os campos do formulário.",
      errors: parsed.error.flatten().fieldErrors
    };
  }

  const images = await moveTempImages(parsed.data.images, id);
  const property = await prisma.property.update({ where: { id }, data: { ...parsed.data, images } });
  refreshPropertyPages();
  revalidatePath(`/imoveis/${property.code}`);
  revalidatePath(`/admin/imoveis/${id}/editar`);

  return { success: true, message: "Imóvel atualizado com sucesso." };
}

export async function duplicatePropertyAction(id: string) {
  await requireCurrentUser();

  const source = await prisma.property.findUnique({ where: { id } });
  if (!source) return;

  // Copia os dados; a cópia nasce como rascunho, sem destaque e sem visualizações.
  const { id: _id, code: _code, createdAt: _createdAt, updatedAt: _updatedAt, viewCount: _viewCount, ...data } = source;
  const copy = await prisma.property.create({
    data: { ...data, title: `${source.title} (cópia)`, status: "DRAFT", featured: false }
  });

  refreshPropertyPages();
  redirect(`/admin/imoveis/${copy.id}/editar?duplicated=1`);
}

export async function deletePropertyAction(id: string) {
  await requireCurrentUser();

  await prisma.property.delete({ where: { id } });
  refreshPropertyPages();
}

export async function createLeadAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  // Honeypot: campo invisível que só robôs preenchem. Finge sucesso para não dar pistas.
  if (String(formData.get("website") ?? "")) {
    return { success: true, message: "Recebemos seu contato! Em breve nossa equipe falará com você." };
  }

  const ip = await getClientIp();
  const values = {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    message: String(formData.get("message") ?? "")
  };

  const parsed = leadSchema.safeParse({
    ...values,
    propertyId: formData.get("propertyId"),
    message: values.message || undefined
  });

  if (!parsed.success) {
    return { success: false, message: "Revise os campos destacados.", errors: parsed.error.flatten().fieldErrors, values };
  }

  // O limite conta só envios válidos, para erros de digitação não bloquearem o cliente.
  if (!checkRateLimit(`lead:${ip}`, 5, 10 * 60 * 1000).allowed) {
    return { success: false, message: "Muitos envios em pouco tempo. Tente novamente em alguns minutos.", values };
  }

  const lead = await createLead(parsed.data);
  if (!lead) return { success: false, message: "Este imóvel não está mais disponível.", values };

  revalidatePath("/admin", "layout");
  return { success: true, message: "Recebemos seu contato! Em breve nossa equipe falará com você." };
}

/** Corretores só mexem em leads sem responsável ou atribuídos a eles; admins, em todos. */
async function findEditableLead(id: string, user: { id: string; role: string }) {
  const lead = await prisma.lead.findUnique({ where: { id }, select: { id: true, assignedToId: true } });
  if (!lead) return null;
  if (user.role === "ADMIN" || !lead.assignedToId || lead.assignedToId === user.id) return lead;
  return null;
}

export async function updateLeadStatusAction(id: string, formData: FormData) {
  const user = await requireCurrentUser("/admin/leads");

  const status = String(formData.get("status") ?? "");
  if (!isLeadStatus(status)) return;

  const lead = await findEditableLead(id, user);
  if (!lead) return;

  // O corretor que atende um lead sem responsável passa a ser o responsável.
  const assignedToId = lead.assignedToId ?? (user.role === "CORRETOR" ? user.id : null);

  await prisma.lead.update({ where: { id }, data: { status, assignedToId } });
  revalidatePath("/admin", "layout");
}

export async function assignLeadAction(id: string, formData: FormData) {
  const user = await requireCurrentUser("/admin/leads");

  const lead = await findEditableLead(id, user);
  if (!lead) return;

  const requested = String(formData.get("assignedToId") ?? "");
  let assignedToId: string | null;

  if (user.role === "ADMIN") {
    // Admin atribui a qualquer usuário ativo, ou deixa sem responsável.
    const target = requested ? await prisma.user.findFirst({ where: { id: requested, active: true }, select: { id: true } }) : null;
    if (requested && !target) return;
    assignedToId = target?.id ?? null;
  } else {
    // Corretor só pode assumir o lead para si.
    if (requested !== user.id) return;
    assignedToId = user.id;
  }

  await prisma.lead.update({ where: { id }, data: { assignedToId } });
  revalidatePath("/admin", "layout");
}

function getSafeRedirectPath(value: FormDataEntryValue | null) {
  const path = String(value ?? "/admin");

  if (!path.startsWith("/") || path.startsWith("//")) {
    return "/admin";
  }

  return path;
}

export async function loginAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { success: false, message: "Informe e-mail e senha." };
  }

  const rateLimitKey = `login:${email}:${await getClientIp()}`;
  if (!checkRateLimit(rateLimitKey, 5, 15 * 60 * 1000).allowed) {
    return { success: false, message: "Muitas tentativas de login. Aguarde 15 minutos e tente novamente." };
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return { success: false, message: "E-mail ou senha inválidos." };
  }

  if (!user.active) {
    return { success: false, message: "Este usuário está desativado. Fale com um administrador." };
  }

  resetRateLimit(rateLimitKey);
  await createSession({ id: user.id, email: user.email });

  if (user.mustChangePassword) redirect("/conta?primeiro-acesso=1");
  redirect(getSafeRedirectPath(formData.get("next")));
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
