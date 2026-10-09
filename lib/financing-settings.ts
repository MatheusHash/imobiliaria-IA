import { z } from "zod";
import { prisma } from "./prisma";

// Registro único: esta instalação atende uma imobiliária só (ver docs/modulos.md, seção 2.1).
const SETTINGS_ID = "default";

export const financingSettingsSchema = z.object({
  defaultRateYearly: z.coerce.number().min(0.1, "Informe uma taxa válida").max(50, "Taxa muito alta"),
  minDownPaymentPct: z.coerce.number().min(0, "Informe um percentual válido").max(90, "Percentual muito alto"),
  maxMonths: z.coerce.number().int().min(12, "Prazo mínimo de 12 meses").max(480, "Prazo máximo de 480 meses")
});

export type FinancingSettingsInput = z.infer<typeof financingSettingsSchema>;

const DEFAULTS: FinancingSettingsInput = {
  defaultRateYearly: 11,
  minDownPaymentPct: 20,
  maxMonths: 420
};

/** Nunca lança — se ainda não houver configuração salva, devolve os padrões sugeridos. */
export async function getFinancingSettings(): Promise<FinancingSettingsInput> {
  const settings = await prisma.financingSettings.findUnique({ where: { id: SETTINGS_ID } });
  if (!settings) return DEFAULTS;

  return {
    defaultRateYearly: Number(settings.defaultRateYearly),
    minDownPaymentPct: Number(settings.minDownPaymentPct),
    maxMonths: settings.maxMonths
  };
}

export async function updateFinancingSettings(data: FinancingSettingsInput) {
  await prisma.financingSettings.upsert({
    where: { id: SETTINGS_ID },
    create: { id: SETTINGS_ID, ...data },
    update: data
  });
}
