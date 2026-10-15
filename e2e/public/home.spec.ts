import { test, expect } from "@playwright/test";

test.describe("Home", () => {
  test("mostra imóveis em destaque e permite ir para a listagem completa", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { name: /Encontre o imóvel ideal/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Imóveis em destaque" })).toBeVisible();
    await expect(page.getByText("Apartamento E2E disponível")).toBeVisible();

    await page.getByRole("link", { name: "Ver todos" }).click();
    await expect(page).toHaveURL(/\/imoveis$/);
  });

  test("busca pela home navega para a listagem com os filtros aplicados", async ({ page }) => {
    await page.goto("/");

    await page.getByLabel("Cidade").fill("Cidade E2E");
    await page.getByRole("button", { name: "Buscar" }).click();

    await expect(page).toHaveURL(/\/imoveis\?.*city=Cidade/);
    await expect(page.getByText("Apartamento E2E disponível")).toBeVisible();
  });
});
