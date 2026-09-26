import { LeadStatus, Prisma, Role } from "@prisma/client";
import { z } from "zod";
import { prisma } from "./prisma";
import { ACCEPTS_LEADS_STATUSES } from "./property-status";

export const leadSchema = z.object({
  propertyId: z.string().uuid("Imóvel inválido"),
  name: z.string().trim().min(2, "Informe seu nome"),
  email: z.string().trim().email("E-mail inválido"),
  phone: z
    .string()
    .trim()
    .refine((value) => value.replace(/\D/g, "").length >= 10, "Informe o telefone com DDD"),
  message: z.string().trim().max(2000, "Mensagem muito longa").optional()
});

export type LeadInput = z.infer<typeof leadSchema>;

export const leadStatusLabels: Record<LeadStatus, string> = {
  NEW: "Novo",
  IN_PROGRESS: "Em atendimento",
  CONVERTED: "Convertido",
  LOST: "Perdido"
};

export const leadStatuses = Object.keys(leadStatusLabels) as LeadStatus[];

export function isLeadStatus(value?: string | null): value is LeadStatus {
  return !!value && value in leadStatusLabels;
}

/** Leads visíveis para o usuário: admin vê todos; corretor vê os sem responsável e os seus. */
export function leadScope(user: { id: string; role: Role }): Prisma.LeadWhereInput {
  return user.role === "ADMIN" ? {} : { OR: [{ assignedToId: null }, { assignedToId: user.id }] };
}

export async function createLead(data: LeadInput) {
  const property = await prisma.property.findUnique({ where: { id: data.propertyId }, select: { status: true } });
  if (!property || !ACCEPTS_LEADS_STATUSES.includes(property.status)) return null;

  return prisma.lead.create({ data });
}

/** Link do WhatsApp para um telefone brasileiro, com mensagem opcional. */
export function whatsappLink(phone: string, text?: string) {
  let digits = phone.replace(/\D/g, "");
  if (digits.length === 10 || digits.length === 11) digits = `55${digits}`;
  const query = text ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/${digits}${query}`;
}
