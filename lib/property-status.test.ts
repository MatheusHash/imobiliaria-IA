import { describe, expect, it } from "vitest";
import { ACCEPTS_LEADS_STATUSES, isPropertyStatus, LISTED_STATUSES, PUBLIC_PAGE_STATUSES } from "./property-status";

describe("property-status", () => {
  it("só lista imóveis disponíveis no site público", () => {
    expect(LISTED_STATUSES).toEqual(["AVAILABLE"]);
  });

  it("aceita leads em disponível e reservado, não nos demais", () => {
    expect(ACCEPTS_LEADS_STATUSES).toContain("AVAILABLE");
    expect(ACCEPTS_LEADS_STATUSES).toContain("RESERVED");
    expect(ACCEPTS_LEADS_STATUSES).not.toContain("SOLD");
    expect(ACCEPTS_LEADS_STATUSES).not.toContain("DRAFT");
  });

  it("páginas públicas cobrem disponível, reservado, vendido e alugado, não rascunho/inativo", () => {
    expect(PUBLIC_PAGE_STATUSES).not.toContain("DRAFT");
    expect(PUBLIC_PAGE_STATUSES).not.toContain("INACTIVE");
  });

  it("isPropertyStatus valida só os valores do enum", () => {
    expect(isPropertyStatus("AVAILABLE")).toBe(true);
    expect(isPropertyStatus("INEXISTENTE")).toBe(false);
    expect(isPropertyStatus(undefined)).toBe(false);
    expect(isPropertyStatus(null)).toBe(false);
  });
});
