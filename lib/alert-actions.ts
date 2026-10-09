"use server";

import { revalidatePath } from "next/cache";
import type { ActionState } from "./actions";
import { alertSubscribeSchema, cancelAlert, createAlert } from "./alerts";
import { requireAdmin } from "./auth";
import { isModuleEnabled, requireModule } from "./modules";
import { prisma } from "./prisma";
import { checkRateLimit, getClientIp } from "./rate-limit";

export async function subscribeToAlertAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  // Honeypot: campo invisível que só robôs preenchem. Finge sucesso para não dar pistas.
  if (String(formData.get("website") ?? "")) {
    return { success: true, message: "Confira seu e-mail para confirmar o alerta." };
  }

  if (!(await isModuleEnabled("alertas"))) {
    return { success: false, message: "O alerta de novos imóveis não está disponível no momento." };
  }

  const email = String(formData.get("email") ?? "");
  const parsed = alertSubscribeSchema.safeParse({
    email,
    filters: {
      type: formData.get("type") || undefined,
      transactionType: formData.get("transactionType") || undefined,
      city: formData.get("city") || undefined,
      neighborhood: formData.get("neighborhood") || undefined,
      minPrice: formData.get("minPrice") || undefined,
      maxPrice: formData.get("maxPrice") || undefined,
      bedrooms: formData.get("bedrooms") || undefined,
      parking: formData.get("parking") || undefined
    }
  });

  if (!parsed.success) {
    return { success: false, message: "Informe um e-mail válido.", errors: parsed.error.flatten().fieldErrors, values: { email } };
  }

  const ip = await getClientIp();
  if (!checkRateLimit(`alert:${ip}`, 5, 10 * 60 * 1000).allowed) {
    return { success: false, message: "Muitos pedidos em pouco tempo. Tente novamente em alguns minutos.", values: { email } };
  }

  await createAlert(parsed.data.email, parsed.data.filters);

  return { success: true, message: "Quase lá! Confira seu e-mail para confirmar o alerta." };
}

/** Chamada diretamente pelo botão "Cancelar alerta" da página pública — não na carga da página,
 * para um link de e-mail pré-carregado por um scanner de segurança não cancelar sozinho. */
export async function cancelAlertByTokenAction(token: string): Promise<{ ok: boolean; message: string }> {
  const alert = await cancelAlert(token);
  if (!alert) return { ok: false, message: "Link inválido ou alerta já removido." };
  return { ok: true, message: "Alerta cancelado. Você não vai mais receber esses e-mails." };
}

export async function toggleAlertAction(id: string, formData: FormData) {
  await requireAdmin("/admin/alertas");
  await requireModule("alertas");

  const active = formData.get("active") === "on";
  await prisma.propertyAlert.update({ where: { id }, data: { active } });
  revalidatePath("/admin/alertas");
}
