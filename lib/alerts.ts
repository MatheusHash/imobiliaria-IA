import { randomBytes } from "crypto";
import { z } from "zod";
import { emailSender } from "./email";
import { prisma } from "./prisma";
import { buildPropertyWhere } from "./properties";
import { isModuleEnabled } from "./modules";
import { siteConfig } from "./site";
import { formatCurrency, propertyTypeLabel, transactionTypeLabel } from "./utils";

// Só os campos de busca que fazem sentido guardar num alerta — sem paginação/ordenação/código.
export const alertFiltersSchema = z.object({
  type: z.string().optional(),
  transactionType: z.string().optional(),
  city: z.string().optional(),
  neighborhood: z.string().optional(),
  minPrice: z.string().optional(),
  maxPrice: z.string().optional(),
  bedrooms: z.string().optional(),
  parking: z.string().optional()
});

export type AlertFilters = z.infer<typeof alertFiltersSchema>;

export const alertSubscribeSchema = z.object({
  email: z.string().trim().email("E-mail inválido"),
  filters: alertFiltersSchema
});

function generateToken() {
  return randomBytes(24).toString("base64url");
}

/** Texto curto para o e-mail e a tela do admin, ex.: "Apartamento · Venda · São Paulo". */
export function describeAlertFilters(filters: AlertFilters) {
  const parts = [
    filters.type && propertyTypeLabel(filters.type),
    filters.transactionType && transactionTypeLabel(filters.transactionType),
    filters.city,
    filters.neighborhood,
    filters.bedrooms && `${filters.bedrooms}+ quartos`,
    filters.parking && `${filters.parking}+ vagas`,
    filters.minPrice && `a partir de ${formatCurrency(Number(filters.minPrice))}`,
    filters.maxPrice && `até ${formatCurrency(Number(filters.maxPrice))}`
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" · ") : "Qualquer imóvel novo";
}

export async function createAlert(email: string, filters: AlertFilters) {
  const confirmToken = generateToken();
  const cancelToken = generateToken();

  const alert = await prisma.propertyAlert.create({
    data: { email, filters, confirmToken, cancelToken }
  });

  await emailSender.send({
    to: email,
    subject: "Confirme seu alerta de novos imóveis",
    text: [
      `Você pediu para ser avisado quando surgir um imóvel assim: ${describeAlertFilters(filters)}.`,
      `Confirme clicando no link: ${siteConfig.url}/alertas/confirmar?token=${confirmToken}`,
      `Se não foi você, ignore este e-mail — nada será enviado sem a confirmação.`
    ].join("\n\n")
  });

  return alert;
}

export async function confirmAlert(token: string) {
  const alert = await prisma.propertyAlert.findUnique({ where: { confirmToken: token } });
  if (!alert) return null;

  return prisma.propertyAlert.update({ where: { id: alert.id }, data: { confirmed: true } });
}

export async function getAlertByCancelToken(token: string) {
  return prisma.propertyAlert.findUnique({ where: { cancelToken: token } });
}

export async function cancelAlert(token: string) {
  const alert = await prisma.propertyAlert.findUnique({ where: { cancelToken: token } });
  if (!alert) return null;

  return prisma.propertyAlert.update({ where: { id: alert.id }, data: { active: false } });
}

/**
 * Varre os alertas confirmados e ativos, procura imóveis novos (criados depois do
 * último aviso) que batem com o filtro salvo, e envia um e-mail por alerta com
 * correspondência. Chamada depois de publicar um imóvel (ver lib/actions.ts) e
 * também pode rodar como tarefa agendada via scripts/check-property-alerts.ts —
 * seguro chamar várias vezes, porque só considera imóveis criados após o último aviso.
 */
export async function runAlertSweep() {
  if (!(await isModuleEnabled("alertas"))) return { checked: 0, notified: 0 };

  const alerts = await prisma.propertyAlert.findMany({ where: { active: true, confirmed: true } });
  let notified = 0;

  for (const alert of alerts) {
    const filters = alert.filters as AlertFilters;
    const where = {
      ...buildPropertyWhere(filters, "public"),
      createdAt: { gt: alert.lastNotifiedAt ?? alert.createdAt }
    };

    const matches = await prisma.property.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: { code: true, title: true, price: true, transactionType: true },
      take: 10
    });

    if (matches.length === 0) continue;

    const lines = matches.map(
      (property) => `${property.title} — ${formatCurrency(Number(property.price), property.transactionType)} — ${siteConfig.url}/imoveis/${property.code}`
    );

    await emailSender.send({
      to: alert.email,
      subject: matches.length === 1 ? "Novo imóvel que combina com você" : `${matches.length} novos imóveis que combinam com você`,
      text: [
        `Encontramos imóveis novos para o alerta "${describeAlertFilters(filters)}":`,
        lines.join("\n"),
        `Cancelar este alerta: ${siteConfig.url}/alertas/cancelar?token=${alert.cancelToken}`
      ].join("\n\n")
    });

    await prisma.propertyAlert.update({ where: { id: alert.id }, data: { lastNotifiedAt: new Date() } });
    notified++;
  }

  return { checked: alerts.length, notified };
}
