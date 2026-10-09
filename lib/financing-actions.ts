"use server";

import { revalidatePath } from "next/cache";
import type { ActionState } from "./actions";
import { requireAdmin } from "./auth";
import { financingSettingsSchema, updateFinancingSettings } from "./financing-settings";
import { requireModule } from "./modules";

export async function updateFinancingSettingsAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin("/admin/financiamento");
  await requireModule("financiamento");

  const parsed = financingSettingsSchema.safeParse({
    defaultRateYearly: formData.get("defaultRateYearly"),
    minDownPaymentPct: formData.get("minDownPaymentPct"),
    maxMonths: formData.get("maxMonths")
  });

  if (!parsed.success) {
    return { success: false, message: "Revise os campos do formulário.", errors: parsed.error.flatten().fieldErrors };
  }

  await updateFinancingSettings(parsed.data);
  revalidatePath("/admin/financiamento");

  return { success: true, message: "Configuração salva." };
}
