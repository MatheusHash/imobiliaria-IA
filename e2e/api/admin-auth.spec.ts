import { test, expect } from "@playwright/test";
import { prisma } from "../db";
import { E2E_ADMIN, E2E_INACTIVE } from "../credentials";
import { sessionCookieHeader } from "./auth-helpers";

const validPropertyPayload = {
  title: "Imóvel via API E2E",
  description: "Criado direto pela API administrativa, sem passar pelo formulário.",
  price: 350000,
  type: "APARTMENT",
  transactionType: "SALE",
  bedrooms: 2,
  bathrooms: 1,
  area: 65,
  city: "Cidade API E2E",
  neighborhood: "Centro",
  address: "Rua da API, 1",
  images: ["/uploads/e2e/api-1.svg"]
};

test.describe("Fronteira de autenticação de /api/admin/*", () => {
  test("POST /api/admin/properties sem sessão retorna 401 e não cria nada", async ({ request }) => {
    // Checa pelo título específico, não pela contagem total: outras specs criam imóveis
    // em paralelo, então o total do banco muda o tempo todo durante a suíte.
    const uniqueTitle = `${validPropertyPayload.title} ${Date.now()}`;
    const response = await request.post("/api/admin/properties", { data: { ...validPropertyPayload, title: uniqueTitle } });

    expect(response.status()).toBe(401);
    expect(await prisma.property.findFirst({ where: { title: uniqueTitle } })).toBeNull();
  });

  test("POST /api/admin/properties com sessão de usuário desativado retorna 401", async ({ request }) => {
    const inactiveUser = await prisma.user.findUniqueOrThrow({ where: { email: E2E_INACTIVE.email } });
    const response = await request.post("/api/admin/properties", {
      data: validPropertyPayload,
      headers: sessionCookieHeader(inactiveUser)
    });

    expect(response.status()).toBe(401);
  });

  test("POST /api/admin/properties com sessão válida de admin cria o imóvel (201)", async ({ request }) => {
    const admin = await prisma.user.findUniqueOrThrow({ where: { email: E2E_ADMIN.email } });
    const response = await request.post("/api/admin/properties", {
      data: validPropertyPayload,
      headers: sessionCookieHeader(admin)
    });

    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.title).toBe(validPropertyPayload.title);

    const created = await prisma.property.findUnique({ where: { id: body.id } });
    expect(created).not.toBeNull();
  });

  test("POST /api/admin/properties com payload inválido retorna 400, mesmo autenticado", async ({ request }) => {
    const admin = await prisma.user.findUniqueOrThrow({ where: { email: E2E_ADMIN.email } });
    const response = await request.post("/api/admin/properties", {
      data: { ...validPropertyPayload, price: -100 },
      headers: sessionCookieHeader(admin)
    });

    expect(response.status()).toBe(400);
  });

  test("PUT e DELETE /api/admin/properties/[id] sem sessão retornam 401", async ({ request }) => {
    const property = await prisma.property.findFirstOrThrow({ where: { title: "Apartamento E2E disponível" } });

    const putResponse = await request.put(`/api/admin/properties/${property.id}`, { data: validPropertyPayload });
    expect(putResponse.status()).toBe(401);

    const deleteResponse = await request.delete(`/api/admin/properties/${property.id}`);
    expect(deleteResponse.status()).toBe(401);

    // Confirma que nada foi alterado de fato.
    const stillThere = await prisma.property.findUnique({ where: { id: property.id } });
    expect(stillThere?.title).toBe("Apartamento E2E disponível");
  });

  test("PUT /api/admin/properties/[id] com sessão válida atualiza o imóvel", async ({ request }) => {
    const admin = await prisma.user.findUniqueOrThrow({ where: { email: E2E_ADMIN.email } });
    const property = await prisma.property.create({
      data: {
        title: "Imóvel para PUT via API",
        description: "Criado para o teste de atualização via API administrativa.",
        price: 100000,
        type: "LAND",
        transactionType: "SALE",
        bedrooms: 0,
        bathrooms: 0,
        area: 200,
        city: "Cidade API E2E",
        neighborhood: "Centro",
        address: "Rua da API, 2",
        images: ["/uploads/e2e/api-2.svg"]
      }
    });

    const response = await request.put(`/api/admin/properties/${property.id}`, {
      data: { ...validPropertyPayload, title: "Imóvel Atualizado via API" },
      headers: sessionCookieHeader(admin)
    });

    expect(response.status()).toBe(200);
    const updated = await prisma.property.findUnique({ where: { id: property.id } });
    expect(updated?.title).toBe("Imóvel Atualizado via API");
  });

  test("DELETE /api/admin/properties/[id] com sessão válida remove o imóvel", async ({ request }) => {
    const admin = await prisma.user.findUniqueOrThrow({ where: { email: E2E_ADMIN.email } });
    const property = await prisma.property.create({
      data: {
        title: "Imóvel para DELETE via API",
        description: "Criado para o teste de remoção via API administrativa.",
        price: 100000,
        type: "LAND",
        transactionType: "SALE",
        bedrooms: 0,
        bathrooms: 0,
        area: 200,
        city: "Cidade API E2E",
        neighborhood: "Centro",
        address: "Rua da API, 3",
        images: ["/uploads/e2e/api-3.svg"]
      }
    });

    const response = await request.delete(`/api/admin/properties/${property.id}`, { headers: sessionCookieHeader(admin) });

    expect(response.status()).toBe(200);
    expect(await prisma.property.findUnique({ where: { id: property.id } })).toBeNull();
  });

  test("POST /api/admin/upload sem sessão retorna 401", async ({ request }) => {
    // A rota checa a sessão antes de ler o corpo da requisição, então nem precisa enviar arquivo.
    const response = await request.post("/api/admin/upload");
    expect(response.status()).toBe(401);
  });
});
