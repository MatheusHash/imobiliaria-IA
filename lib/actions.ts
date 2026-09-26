"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSession, destroySession, requireCurrentUser, verifyPassword } from "./auth";
import { createLead, isLeadStatus, leadSchema } from "./leads";
import { prisma } from "./prisma";
import { checkRateLimit, getClientIp } from "./rate-limit";
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
    images: parseImagesText(String(formData.get("imagesText") ?? ""))
  };
}

function refreshPropertyPages() {
  revalidatePath("/");
  revalidatePath("/imoveis");
  revalidatePath("/admin/imoveis");
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

  const property = await prisma.property.update({ where: { id }, data: parsed.data });
  refreshPropertyPages();
  revalidatePath(`/imoveis/${property.code}`);
  revalidatePath(`/admin/imoveis/${id}/editar`);

  return { success: true, message: "Imóvel atualizado com sucesso." };
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

  revalidatePath("/admin/leads");
  return { success: true, message: "Recebemos seu contato! Em breve nossa equipe falará com você." };
}

export async function updateLeadStatusAction(id: string, formData: FormData) {
  await requireCurrentUser("/admin/leads");

  const status = String(formData.get("status") ?? "");
  if (!isLeadStatus(status)) return;

  await prisma.lead.update({ where: { id }, data: { status } });
  revalidatePath("/admin/leads");
}

function getSafeRedirectPath(value: FormDataEntryValue | null) {
  const path = String(value ?? "/admin/imoveis");

  if (!path.startsWith("/") || path.startsWith("//")) {
    return "/admin/imoveis";
  }

  return path;
}

export async function loginAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { success: false, message: "Informe e-mail e senha." };
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return { success: false, message: "E-mail ou senha inválidos." };
  }

  await createSession({ id: user.id, email: user.email });
  redirect(getSafeRedirectPath(formData.get("next")));
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
