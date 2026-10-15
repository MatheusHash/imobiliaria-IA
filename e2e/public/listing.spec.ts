import { test, expect } from "@playwright/test";

test.describe("Listagem de imóveis", () => {
  test("lista só imóveis disponíveis, nunca rascunho/reservado/vendido", async ({ page }) => {
    // Filtra por cidade: sem isso, os 15 imóveis de "Cidade Paginação" (mais recentes)
    // ocupam a primeira página e empurram "Apartamento E2E disponível" para a 2ª.
    await page.goto("/imoveis?city=Cidade+E2E");

    await expect(page.getByText("Apartamento E2E disponível")).toBeVisible();
    await expect(page.getByText("Casa E2E reservada")).toHaveCount(0);
    await expect(page.getByText("Sala E2E vendida")).toHaveCount(0);
    await expect(page.getByText("Terreno E2E rascunho")).toHaveCount(0);
  });

  test("filtra por tipo e cidade", async ({ page }) => {
    await page.goto("/imoveis");

    await page.getByLabel("Cidade").fill("Cidade E2E");
    await page.getByLabel("Tipo").selectOption("HOUSE");
    await page.getByRole("button", { name: "Buscar" }).click();

    await expect(page).toHaveURL(/type=HOUSE/);
    await expect(page.getByText("Apartamento E2E disponível")).toHaveCount(0);
  });

  test("busca por código redireciona direto para a página do imóvel", async ({ page }) => {
    await page.goto("/imoveis");

    await page.getByLabel("Código").fill("1001");
    await page.getByRole("button", { name: "Buscar" }).click();

    await expect(page).toHaveURL(/\/imoveis\/1001$/);
    await expect(page.getByRole("heading", { name: "Apartamento E2E disponível" })).toBeVisible();
  });

  test("filtro sem resultado mostra listagem vazia", async ({ page }) => {
    await page.goto("/imoveis");

    await page.getByLabel("Cidade").fill("Cidade Inexistente XYZ");
    await page.getByRole("button", { name: "Buscar" }).click();

    await expect(page.getByText("0 imóveis encontrados")).toBeVisible();
    await expect(page.getByText("Apartamento E2E disponível")).toHaveCount(0);
  });

  test("filtra por faixa de preço", async ({ page }) => {
    // Seed: "Imóvel E2E Paginação N" custa 200000 + N*10000 (N de 1 a 15).
    await page.goto("/imoveis");
    await page.getByLabel("Cidade").fill("Cidade Paginação");
    // CurrencyInput lê os dígitos digitados como centavos (lib/currency.ts): "30000000" => R$ 300.000,00.
    await page.getByLabel("Preço mín.").fill("30000000");
    await page.getByLabel("Preço máx.").fill("32000000");
    await page.getByRole("button", { name: "Buscar" }).click();

    await expect(page.getByText("3 imóveis encontrados")).toBeVisible();
    await expect(page.getByText("Imóvel E2E Paginação 10")).toBeVisible();
    await expect(page.getByText("Imóvel E2E Paginação 11")).toBeVisible();
    await expect(page.getByText("Imóvel E2E Paginação 12")).toBeVisible();
    await expect(page.getByText("Imóvel E2E Paginação 9")).toHaveCount(0);
    await expect(page.getByText("Imóvel E2E Paginação 13")).toHaveCount(0);
  });

  test("filtra por mínimo de quartos e de vagas", async ({ page }) => {
    // Seed: a cada 3 imóveis de paginação, um tem 3 quartos/2 vagas (N = 2, 5, 8, 11, 14).
    await page.goto("/imoveis");
    await page.getByLabel("Cidade").fill("Cidade Paginação");
    await page.getByText("Mais filtros").click();
    await page.getByLabel("Quartos").selectOption("3");
    await page.getByRole("button", { name: "Buscar" }).click();

    await expect(page.getByText("5 imóveis encontrados")).toBeVisible();
    await expect(page.getByText("Imóvel E2E Paginação 2", { exact: true })).toBeVisible();
    await expect(page.getByText("Imóvel E2E Paginação 14", { exact: true })).toBeVisible();
    await expect(page.getByText("Imóvel E2E Paginação 1", { exact: true })).toHaveCount(0);
  });

  test("filtra por bairro", async ({ page }) => {
    await page.goto("/imoveis");
    await page.getByText("Mais filtros").click();
    await page.getByLabel("Bairro").fill("Bairro Disponível");
    await page.getByRole("button", { name: "Buscar" }).click();

    await expect(page.getByText("1 imóvel encontrado")).toBeVisible();
    await expect(page.getByText("Apartamento E2E disponível")).toBeVisible();
  });

  test("ordena por menor e maior preço", async ({ page }) => {
    await page.goto("/imoveis");
    await page.getByLabel("Cidade").fill("Cidade Paginação");
    await page.getByRole("button", { name: "Buscar" }).click();

    await page.getByRole("link", { name: "Menor preço" }).click();
    await expect(page.getByText("0 imóveis encontrados")).toHaveCount(0);
    const firstCardAsc = page.locator("main a[href^='/imoveis/']").first();
    await expect(firstCardAsc).toContainText("Imóvel E2E Paginação 1");

    await page.getByRole("link", { name: "Maior preço" }).click();
    const firstCardDesc = page.locator("main a[href^='/imoveis/']").first();
    await expect(firstCardDesc).toContainText("Imóvel E2E Paginação 15");
  });

  test("paginação: navega para a 2ª página e volta", async ({ page }) => {
    // 15 imóveis em "Cidade Paginação", PAGE_SIZE = 12 (lib/properties.ts) → 2 páginas.
    await page.goto("/imoveis");
    await page.getByLabel("Cidade").fill("Cidade Paginação");
    await page.getByRole("button", { name: "Buscar" }).click();

    await expect(page.getByText(/15 imóveis encontrados · página 1 de 2/)).toBeVisible();
    await expect(page.getByText("Imóvel E2E Paginação 1", { exact: true })).toHaveCount(0);

    await page.getByRole("link", { name: "Próxima" }).click();
    await expect(page).toHaveURL(/page=2/);
    await expect(page.getByText(/página 2 de 2/)).toBeVisible();
    await expect(page.getByText("Imóvel E2E Paginação 1", { exact: true })).toBeVisible();

    await page.getByRole("link", { name: "Anterior" }).click();
    await expect(page).toHaveURL(/\/imoveis\?city=/);
    await expect(page.getByText(/página 1 de 2/)).toBeVisible();
  });
});
