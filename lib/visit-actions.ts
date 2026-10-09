"use server";

import { revalidatePath } from "next/cache";
import type { ActionState } from "./actions";
import { requireAdmin, requireCurrentUser } from "./auth";
import { isModuleEnabled, requireModule } from "./modules";
import { prisma } from "./prisma";
import { checkRateLimit, getClientIp } from "./rate-limit";
import {
  findEditableVisit,
  isSlotTaken,
  isVisitStatus,
  visitBookingSchema,
  visitSlotRuleSchema
} from "./visits";

export async function createVisitAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  // Honeypot: campo invisível que só robôs preenchem. Finge sucesso para não dar pistas.
  if (String(formData.get("website") ?? "")) {
    return { success: true, message: "Visita agendada! Você vai receber a confirmação da nossa equipe." };
  }

  if (!(await isModuleEnabled("visitas"))) {
    return { success: false, message: "O agendamento de visitas não está disponível no momento." };
  }

  const values = {
    visitorName: String(formData.get("visitorName") ?? ""),
    visitorEmail: String(formData.get("visitorEmail") ?? ""),
    visitorPhone: String(formData.get("visitorPhone") ?? "")
  };

  const parsed = visitBookingSchema.safeParse({
    ...values,
    propertyId: formData.get("propertyId"),
    scheduledFor: formData.get("scheduledFor")
  });

  if (!parsed.success) {
    return { success: false, message: "Revise os campos destacados.", errors: parsed.error.flatten().fieldErrors, values };
  }

  const ip = await getClientIp();
  // O limite conta só envios válidos, para erros de digitação não bloquearem o cliente.
  if (!checkRateLimit(`visit:${ip}`, 5, 10 * 60 * 1000).allowed) {
    return { success: false, message: "Muitos agendamentos em pouco tempo. Tente novamente em alguns minutos.", values };
  }

  if (parsed.data.scheduledFor.getTime() < Date.now()) {
    return { success: false, message: "Escolha um horário futuro.", values };
  }

  if (await isSlotTaken(parsed.data.scheduledFor)) {
    return { success: false, message: "Esse horário acabou de ser preenchido. Escolha outro.", values };
  }

  await prisma.visit.create({ data: parsed.data });
  revalidatePath("/admin", "layout");

  return { success: true, message: "Visita agendada! Você vai receber a confirmação da nossa equipe." };
}

export async function updateVisitStatusAction(id: string, formData: FormData) {
  const user = await requireCurrentUser("/admin/visitas");
  await requireModule("visitas");

  const status = String(formData.get("status") ?? "");
  if (!isVisitStatus(status)) return;

  const visit = await findEditableVisit(id, user);
  if (!visit) return;

  // O corretor que atende uma visita sem responsável passa a ser o responsável.
  const assignedToId = visit.assignedToId ?? (user.role === "CORRETOR" ? user.id : null);

  await prisma.visit.update({ where: { id }, data: { status, assignedToId } });
  revalidatePath("/admin/visitas");
}

export async function assignVisitAction(id: string, formData: FormData) {
  const user = await requireCurrentUser("/admin/visitas");
  await requireModule("visitas");

  const visit = await findEditableVisit(id, user);
  if (!visit) return;

  const requested = String(formData.get("assignedToId") ?? "");
  let assignedToId: string | null;

  if (user.role === "ADMIN") {
    const target = requested ? await prisma.user.findFirst({ where: { id: requested, active: true }, select: { id: true } }) : null;
    if (requested && !target) return;
    assignedToId = target?.id ?? null;
  } else {
    if (requested !== user.id) return;
    assignedToId = user.id;
  }

  await prisma.visit.update({ where: { id }, data: { assignedToId } });
  revalidatePath("/admin/visitas");
}

export async function createVisitSlotRuleAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin("/admin/visitas/disponibilidade");
  await requireModule("visitas");

  const parsed = visitSlotRuleSchema.safeParse({
    weekday: formData.get("weekday"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    slotMinutes: formData.get("slotMinutes")
  });

  if (!parsed.success) {
    return { success: false, message: "Revise os campos do formulário.", errors: parsed.error.flatten().fieldErrors };
  }

  // userId nulo = regra geral da imobiliária; ainda não há agenda por corretor na v1.
  await prisma.visitSlotRule.create({ data: { ...parsed.data, userId: null } });
  revalidatePath("/admin/visitas/disponibilidade");

  return { success: true, message: "Horário adicionado." };
}

export async function toggleVisitSlotRuleAction(id: string, formData: FormData) {
  await requireAdmin("/admin/visitas/disponibilidade");
  await requireModule("visitas");

  const active = formData.get("active") === "on";
  await prisma.visitSlotRule.update({ where: { id }, data: { active } });
  revalidatePath("/admin/visitas/disponibilidade");
}

export async function deleteVisitSlotRuleAction(id: string) {
  await requireAdmin("/admin/visitas/disponibilidade");
  await requireModule("visitas");

  await prisma.visitSlotRule.delete({ where: { id } });
  revalidatePath("/admin/visitas/disponibilidade");
}
