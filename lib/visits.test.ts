import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "./prisma";
import { getAvailableSlots, isSlotTaken, isVisitStatus, visitSlotRuleSchema } from "./visits";

describe("visitSlotRuleSchema", () => {
  it("aceita uma regra válida", () => {
    const result = visitSlotRuleSchema.safeParse({ weekday: 1, startTime: "09:00", endTime: "12:00", slotMinutes: 30 });
    expect(result.success).toBe(true);
  });

  it("rejeita horário final igual ou antes do inicial", () => {
    const result = visitSlotRuleSchema.safeParse({ weekday: 1, startTime: "12:00", endTime: "09:00", slotMinutes: 30 });
    expect(result.success).toBe(false);
  });

  it("rejeita formato de horário inválido", () => {
    const result = visitSlotRuleSchema.safeParse({ weekday: 1, startTime: "9h", endTime: "12:00", slotMinutes: 30 });
    expect(result.success).toBe(false);
  });
});

describe("isVisitStatus", () => {
  it("aceita só os status válidos", () => {
    expect(isVisitStatus("PENDING")).toBe(true);
    expect(isVisitStatus("INEXISTENTE")).toBe(false);
  });
});

// "now" fixo na véspera (terça) para o teste não depender do dia em que roda, e para a
// janela de antecedência mínima (MIN_LEAD_HOURS) não comer os horários do dia seguinte.
const FIXED_NOW = new Date(2026, 9, 6, 8, 0, 0); // 6/out/2026 é uma terça; 7/out é quarta (weekday 3)

describe("getAvailableSlots (integração, banco local)", () => {
  beforeEach(async () => {
    await prisma.visit.deleteMany({ where: { visitorEmail: "teste-slots@example.com" } });
    await prisma.visitSlotRule.deleteMany({ where: { startTime: "09:00", endTime: "10:00" } });
  });

  afterEach(async () => {
    await prisma.visit.deleteMany({ where: { visitorEmail: "teste-slots@example.com" } });
    await prisma.visitSlotRule.deleteMany({ where: { startTime: "09:00", endTime: "10:00" } });
  });

  it("gera slots de 30min dentro da janela da regra, no próximo dia com esse weekday", async () => {
    await prisma.visitSlotRule.create({ data: { userId: null, weekday: 3, startTime: "09:00", endTime: "10:00", slotMinutes: 30, active: true } });

    const days = await getAvailableSlots(14, FIXED_NOW);
    const wednesday = days.find((day) => day.date === "2026-10-07");

    expect(wednesday).toBeDefined();
    expect(wednesday!.slots).toHaveLength(2); // 09:00 e 09:30
    expect(wednesday!.slots.map((slot) => slot.time)).toEqual(["09:00", "09:30"]);
  });

  it("não repete um horário já ocupado por uma visita ativa", async () => {
    const rule = await prisma.visitSlotRule.create({
      data: { userId: null, weekday: 3, startTime: "09:00", endTime: "10:00", slotMinutes: 30, active: true }
    });

    const taken = new Date(2026, 9, 7, 9, 0, 0);
    await prisma.visit.create({
      data: {
        scheduledFor: taken,
        status: "PENDING",
        visitorName: "Teste",
        visitorEmail: "teste-slots@example.com",
        visitorPhone: "11999999999"
      }
    });

    const days = await getAvailableSlots(14, FIXED_NOW);
    const wednesday = days.find((day) => day.date === "2026-10-07");

    expect(wednesday!.slots).toHaveLength(1); // só sobra 09:30
    expect(wednesday!.slots[0].iso).not.toBe(taken.toISOString());
    expect(wednesday!.slots[0].time).toBe("09:30");

    await prisma.visitSlotRule.delete({ where: { id: rule.id } });
  });

  it("isSlotTaken reflete visitas ativas e ignora canceladas", async () => {
    const scheduledFor = new Date(2026, 9, 7, 9, 0, 0);
    expect(await isSlotTaken(scheduledFor)).toBe(false);

    const visit = await prisma.visit.create({
      data: { scheduledFor, status: "CONFIRMED", visitorName: "Teste", visitorEmail: "teste-slots@example.com", visitorPhone: "11999999999" }
    });
    expect(await isSlotTaken(scheduledFor)).toBe(true);

    await prisma.visit.update({ where: { id: visit.id }, data: { status: "CANCELED" } });
    expect(await isSlotTaken(scheduledFor)).toBe(false);
  });
});
