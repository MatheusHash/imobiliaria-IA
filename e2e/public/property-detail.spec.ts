import { test, expect } from "@playwright/test";
import { prisma } from "../db";
import { ADMIN_STORAGE_STATE } from "../auth-storage";

test.describe("Página do imóvel", () => {
  test("mostra os detalhes de um imóvel disponível", async ({ page }) => {
    await page.goto("/imoveis/1001");

    await expect(page.getByRole("heading", { name: "Apartamento E2E disponível" })).toBeVisible();
    await expect(page.getByText(/Código do imóvel:\s*1001/)).toBeVisible();
    await expect(page.getByRole("heading", { name: "Tenho interesse" })).toBeVisible();
  });

  test("redireciona permanentemente o link antigo por UUID para o código", async ({ page }) => {
    const property = await prisma.property.findFirst({ where: { code: 1001 } });
    if (!property) throw new Error("Imóvel de seed (código 1001) não encontrado");

    await page.goto(`/imoveis/${property.id}`);

    await expect(page).toHaveURL(/\/imoveis\/1001$/);
  });

  test("imóvel reservado mostra aviso e ainda aceita interesse", async ({ page }) => {
    const property = await prisma.property.findFirst({ where: { title: "Casa E2E reservada" } });
    if (!property) throw new Error("Imóvel de seed 'Casa E2E reservada' não encontrado");

    await page.goto(`/imoveis/${property.code}`);

    await expect(page.getByText("Deixe seu contato para ser avisado")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Tenho interesse" })).toBeVisible();
  });

  test("imóvel vendido mostra aviso e não aceita mais interesse", async ({ page }) => {
    const property = await prisma.property.findFirst({ where: { title: "Sala E2E vendida" } });
    if (!property) throw new Error("Imóvel de seed 'Sala E2E vendida' não encontrado");

    await page.goto(`/imoveis/${property.code}`);

    await expect(page.getByText(/já foi vendido/i)).toBeVisible();
    await expect(page.getByRole("heading", { name: "Imóvel indisponível" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Tenho interesse" })).toHaveCount(0);
  });

  test("imóvel em rascunho não é acessível a visitantes anônimos", async ({ page }) => {
    const property = await prisma.property.findFirst({ where: { title: "Terreno E2E rascunho" } });
    if (!property) throw new Error("Imóvel de seed 'Terreno E2E rascunho' não encontrado");

    const response = await page.goto(`/imoveis/${property.code}`);

    expect(response?.status()).toBe(404);
  });

  test("código inexistente mostra 404", async ({ page }) => {
    const response = await page.goto("/imoveis/999999");
    expect(response?.status()).toBe(404);
  });

  test("imóvel alugado mostra o aviso correspondente", async ({ page }) => {
    const property = await prisma.property.findFirst({ where: { title: "Studio E2E alugado" } });
    if (!property) throw new Error("Imóvel de seed 'Studio E2E alugado' não encontrado");

    await page.goto(`/imoveis/${property.code}`);

    await expect(page.getByText("Este imóvel já foi alugado.")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Imóvel indisponível" })).toBeVisible();
  });

  test("mostra imóveis semelhantes (mesmo tipo e transação)", async ({ page }) => {
    // "Apartamento E2E disponível" é APARTMENT/SALE, igual aos 15 imóveis de paginação —
    // mas não presume QUAIS aparecem: specs em paralelo criam outros imóveis do mesmo tipo
    // com createdAt mais recente, e a seção mostra os 3 mais recentes.
    await page.goto("/imoveis/1001");

    await expect(page.getByRole("heading", { name: "Imóveis semelhantes" })).toBeVisible();
    const similarSection = page.locator("section", { has: page.getByRole("heading", { name: "Imóveis semelhantes" }) });
    await expect(similarSection.locator("a[href^='/imoveis/']").first()).toBeVisible();
  });

  test("envia o formulário de interesse num imóvel reservado", async ({ page }) => {
    const property = await prisma.property.findFirst({ where: { title: "Casa E2E reservada" } });
    if (!property) throw new Error("Imóvel de seed 'Casa E2E reservada' não encontrado");
    const email = `e2e-lead-reservado-${Date.now()}@example.com`;

    await page.goto(`/imoveis/${property.code}`);
    await page.getByLabel("Nome").fill("Interessado Reservado");
    await page.getByLabel("E-mail").fill(email);
    await page.getByLabel("Telefone / WhatsApp").fill("11988887777");
    await page.getByRole("button", { name: "Enviar interesse" }).click();

    await expect(page.getByText(/Recebemos seu contato/i)).toBeVisible();
    const lead = await prisma.lead.findFirst({ where: { email } });
    expect(lead).not.toBeNull();
  });

  test("corretor logado vê a pré-visualização de um imóvel em rascunho", async ({ browser }) => {
    const property = await prisma.property.findFirst({ where: { title: "Terreno E2E rascunho" } });
    if (!property) throw new Error("Imóvel de seed 'Terreno E2E rascunho' não encontrado");

    const context = await browser.newContext({ storageState: ADMIN_STORAGE_STATE });
    const page = await context.newPage();

    const response = await page.goto(`/imoveis/${property.code}`);
    expect(response?.status()).toBe(200);
    await expect(page.getByText(/Pré-visualização.*rascunho/i)).toBeVisible();

    await context.close();
  });

  test("mapa aparece quando o imóvel tem coordenadas e o módulo está ligado", async ({ page }) => {
    // Seed liga o módulo "mapa" e dá coordenadas só ao imóvel 1001 (ver prisma/seed-e2e.ts).
    await page.goto("/imoveis/1001");
    await expect(page.getByRole("heading", { name: "Localização" })).toBeVisible();
    await expect(page.locator(".leaflet-container")).toBeVisible();
  });

  test("simulador de financiamento aparece num imóvel à venda disponível", async ({ page }) => {
    await page.goto("/imoveis/1001");
    await expect(page.getByRole("heading", { name: /financiamento/i })).toBeVisible();
  });

  test("agendamento de visita aparece num imóvel disponível", async ({ page }) => {
    await page.goto("/imoveis/1001");
    await expect(page.getByRole("heading", { name: "Agendar visita" })).toBeVisible();
  });

  test("galeria: navega entre fotos pelas setas e pelas miniaturas", async ({ page }) => {
    // Imóvel 1001 tem 2 fotos de propósito (ver prisma/seed-e2e.ts).
    await page.goto("/imoveis/1001");

    await expect(page.getByText("1 / 2")).toBeVisible();

    await page.getByRole("button", { name: "Próxima imagem" }).click();
    await expect(page.getByText("2 / 2")).toBeVisible();

    await page.getByRole("button", { name: "Imagem anterior" }).click();
    await expect(page.getByText("1 / 2")).toBeVisible();

    await page.getByRole("button", { name: "Selecionar foto 2" }).click();
    await expect(page.getByText("2 / 2")).toBeVisible();
  });
});
