import { describe, expect, it } from "vitest";
import { isLeadStatus, leadScope, whatsappLink } from "./leads";

describe("leadScope", () => {
  it("admin vê todos os leads (sem filtro)", () => {
    expect(leadScope({ id: "admin-1", role: "ADMIN" })).toEqual({});
  });

  it("corretor vê leads sem responsável ou atribuídos a ele", () => {
    expect(leadScope({ id: "corretor-1", role: "CORRETOR" })).toEqual({
      OR: [{ assignedToId: null }, { assignedToId: "corretor-1" }]
    });
  });
});

describe("whatsappLink", () => {
  it("adiciona o 55 em números com DDD sem código do país", () => {
    expect(whatsappLink("(11) 98888-7777")).toBe("https://wa.me/5511988887777");
  });

  it("mantém o número como está quando já tem o código do país", () => {
    expect(whatsappLink("5511988887777")).toBe("https://wa.me/5511988887777");
  });

  it("inclui a mensagem como query string quando informada", () => {
    expect(whatsappLink("11988887777", "Olá!")).toBe("https://wa.me/5511988887777?text=Ol%C3%A1!");
  });
});

describe("isLeadStatus", () => {
  it("aceita só os status válidos", () => {
    expect(isLeadStatus("NEW")).toBe(true);
    expect(isLeadStatus("INEXISTENTE")).toBe(false);
    expect(isLeadStatus(undefined)).toBe(false);
  });
});
