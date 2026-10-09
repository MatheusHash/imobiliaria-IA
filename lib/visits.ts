import { Prisma, Role, VisitStatus } from "@prisma/client";
import { z } from "zod";
import { prisma } from "./prisma";

export const visitStatusLabels: Record<VisitStatus, string> = {
  PENDING: "Pendente",
  CONFIRMED: "Confirmada",
  CANCELED: "Cancelada",
  DONE: "Realizada",
  NO_SHOW: "Não compareceu"
};

export const visitStatuses = Object.keys(visitStatusLabels) as VisitStatus[];

export function isVisitStatus(value?: string | null): value is VisitStatus {
  return !!value && value in visitStatusLabels;
}

/** Visitas ainda ativas — ocupam o horário e contam para conflito de agenda. */
const ACTIVE_VISIT_STATUSES: VisitStatus[] = ["PENDING", "CONFIRMED"];

export const visitBookingSchema = z.object({
  propertyId: z.string().uuid("Imóvel inválido"),
  scheduledFor: z.coerce.date(),
  visitorName: z.string().trim().min(2, "Informe seu nome"),
  visitorEmail: z.string().trim().email("E-mail inválido"),
  visitorPhone: z
    .string()
    .trim()
    .refine((value) => value.replace(/\D/g, "").length >= 10, "Informe o telefone com DDD")
});

export type VisitBookingInput = z.infer<typeof visitBookingSchema>;

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

export const visitSlotRuleSchema = z
  .object({
    weekday: z.coerce.number().int().min(0).max(6),
    startTime: z.string().regex(timePattern, "Use o formato HH:mm"),
    endTime: z.string().regex(timePattern, "Use o formato HH:mm"),
    slotMinutes: z.coerce.number().int().min(10, "Mínimo de 10 minutos").max(240, "Máximo de 240 minutos")
  })
  .refine((data) => data.startTime < data.endTime, { message: "O horário final precisa ser depois do inicial", path: ["endTime"] });

export type VisitSlotRuleInput = z.infer<typeof visitSlotRuleSchema>;

/** Visitas visíveis para o usuário: admin vê todas; corretor vê as sem responsável e as suas. */
export function visitScope(user: { id: string; role: Role }): Prisma.VisitWhereInput {
  return user.role === "ADMIN" ? {} : { OR: [{ assignedToId: null }, { assignedToId: user.id }] };
}

/** Corretores só mexem em visitas sem responsável ou atribuídas a eles; admins, em todas. */
export async function findEditableVisit(id: string, user: { id: string; role: string }) {
  const visit = await prisma.visit.findUnique({ where: { id }, select: { id: true, assignedToId: true } });
  if (!visit) return null;
  if (user.role === "ADMIN" || !visit.assignedToId || visit.assignedToId === user.id) return visit;
  return null;
}

const DAYS_AHEAD = 14;
/** Não deixa marcar uma visita em cima da hora. */
const MIN_LEAD_HOURS = 2;
const WEEKDAY_LABELS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export type AvailableSlot = { iso: string; time: string };
export type AvailableDay = { date: string; label: string; slots: AvailableSlot[] };

function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

/**
 * Horários livres nos próximos `DAYS_AHEAD` dias, a partir das regras de disponibilidade
 * gerais (VisitSlotRule com userId nulo — ainda não há agenda por corretor). Os horários
 * são "hora de parede": sem conversão de fuso, assumindo o relógio do servidor já configurado
 * no fuso da imobiliária (ver docs/modulos.md, módulo 7 — risco de fuso horário conhecido).
 */
export async function getAvailableSlots(daysAhead = DAYS_AHEAD, now: Date = new Date()): Promise<AvailableDay[]> {
  const rangeEnd = new Date(now);
  rangeEnd.setDate(rangeEnd.getDate() + daysAhead);

  const [rules, busyVisits] = await Promise.all([
    prisma.visitSlotRule.findMany({ where: { userId: null, active: true } }),
    prisma.visit.findMany({
      where: { scheduledFor: { gte: now, lte: rangeEnd }, status: { in: ACTIVE_VISIT_STATUSES } },
      select: { scheduledFor: true }
    })
  ]);

  const busyTimestamps = new Set(busyVisits.map((visit) => visit.scheduledFor.getTime()));
  const earliestAllowed = new Date(now.getTime() + MIN_LEAD_HOURS * 60 * 60 * 1000);

  const rulesByWeekday = new Map<number, typeof rules>();
  for (const rule of rules) {
    rulesByWeekday.set(rule.weekday, [...(rulesByWeekday.get(rule.weekday) ?? []), rule]);
  }

  const days: AvailableDay[] = [];

  for (let offset = 0; offset < daysAhead; offset++) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
    const dayRules = rulesByWeekday.get(day.getDay()) ?? [];
    if (dayRules.length === 0) continue;

    const slots: AvailableSlot[] = [];
    for (const rule of dayRules) {
      const start = timeToMinutes(rule.startTime);
      const end = timeToMinutes(rule.endTime);

      for (let minutes = start; minutes + rule.slotMinutes <= end; minutes += rule.slotMinutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        const slot = new Date(day.getFullYear(), day.getMonth(), day.getDate(), hours, mins);
        if (slot < earliestAllowed) continue;
        if (busyTimestamps.has(slot.getTime())) continue;
        // "time" é formatado aqui (hora do servidor), não recalculado no navegador — evita
        // que o fuso do visitante mostre um horário diferente do que foi de fato reservado.
        slots.push({ iso: slot.toISOString(), time: `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}` });
      }
    }

    if (slots.length > 0) {
      days.push({
        date: `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`,
        label: WEEKDAY_LABELS[day.getDay()],
        slots: slots.sort((a, b) => a.iso.localeCompare(b.iso))
      });
    }
  }

  return days;
}

/** true se já existe uma visita ativa marcada para exatamente esse horário. */
export async function isSlotTaken(scheduledFor: Date) {
  const existing = await prisma.visit.findFirst({
    where: { scheduledFor, status: { in: ACTIVE_VISIT_STATUSES } },
    select: { id: true }
  });
  return !!existing;
}
