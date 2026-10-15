import { test, expect } from "@playwright/test";
import { prisma } from "../db";

test.describe("GET /api/properties", () => {
  test("lista só imóveis disponíveis, com os mesmos filtros do site", async ({ request }) => {
    const response = await request.get("/api/properties?city=Cidade+E2E");
    expect(response.status()).toBe(200);

    const properties = await response.json();
    const titles = properties.map((p: { title: string }) => p.title);
    expect(titles).toContain("Apartamento E2E disponível");
    expect(titles).not.toContain("Casa E2E reservada");
    expect(titles).not.toContain("Terreno E2E rascunho");
  });

  test("filtra por tipo e transação", async ({ request }) => {
    const response = await request.get("/api/properties?type=HOUSE&transactionType=RENT");
    const properties = await response.json();
    for (const property of properties) {
      expect(property.type).toBe("HOUSE");
      expect(property.transactionType).toBe("RENT");
    }
  });
});

test.describe("GET /api/properties/[id]", () => {
  test("devolve um imóvel disponível pelo código ou pelo UUID", async ({ request }) => {
    const property = await prisma.property.findFirstOrThrow({ where: { title: "Apartamento E2E disponível" } });

    const byCode = await request.get(`/api/properties/${property.code}`);
    expect(byCode.status()).toBe(200);
    expect((await byCode.json()).title).toBe("Apartamento E2E disponível");

    const byId = await request.get(`/api/properties/${property.id}`);
    expect(byId.status()).toBe(200);
  });

  test("devolve 404 para rascunho/inativo (não é uma página pública)", async ({ request }) => {
    const draft = await prisma.property.findFirstOrThrow({ where: { title: "Terreno E2E rascunho" } });
    const response = await request.get(`/api/properties/${draft.code}`);
    expect(response.status()).toBe(404);
  });

  test("devolve 404 para código inexistente", async ({ request }) => {
    const response = await request.get("/api/properties/999999");
    expect(response.status()).toBe(404);
  });
});

test.describe("POST /api/properties/interesse", () => {
  test("cria um lead a partir de um payload JSON válido", async ({ request }) => {
    const property = await prisma.property.findFirstOrThrow({ where: { title: "Apartamento E2E disponível" } });
    const email = `e2e-api-lead-${Date.now()}@example.com`;

    const response = await request.post("/api/properties/interesse", {
      data: { propertyId: property.id, name: "Interessado via API", email, phone: "11955554444" }
    });

    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.success).toBe(true);

    const lead = await prisma.lead.findFirst({ where: { email } });
    expect(lead).not.toBeNull();
  });

  test("payload inválido retorna 400 com os erros de campo", async ({ request }) => {
    const response = await request.post("/api/properties/interesse", {
      data: { propertyId: "não-é-um-uuid", name: "A", email: "invalido", phone: "123" }
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.errors).toHaveProperty("propertyId");
    expect(body.errors).toHaveProperty("email");
  });

  test("imóvel inexistente retorna 404", async ({ request }) => {
    const response = await request.post("/api/properties/interesse", {
      data: {
        propertyId: "00000000-0000-0000-0000-000000000000",
        name: "Interessado Fantasma",
        email: `e2e-api-fantasma-${Date.now()}@example.com`,
        phone: "11955554444"
      }
    });

    expect(response.status()).toBe(404);
  });
});
