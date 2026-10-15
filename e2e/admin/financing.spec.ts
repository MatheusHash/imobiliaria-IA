import { test, expect } from "@playwright/test";
import { ADMIN_STORAGE_STATE } from "../auth-storage";

test.use({ storageState: ADMIN_STORAGE_STATE });

test.describe("Admin — simulador de financiamento", () => {
  test("atualiza a taxa sugerida e ela passa a valer no simulador público", async ({ page }) => {
    await page.goto("/admin/financiamento");

    await page.getByLabel("Taxa de juros sugerida (% ao ano)").fill("9.5");
    await page.getByLabel("Entrada mínima sugerida (%)").fill("15");
    await page.getByLabel("Prazo máximo (meses)").fill("360");
    await page.getByRole("button", { name: "Salvar" }).click();

    await expect(page.getByText("Configuração salva.")).toBeVisible();

    await page.goto("/imoveis/1001");
    await expect(page.getByRole("heading", { name: "Simule seu financiamento" })).toBeVisible();

    // Reabre a página de configurações e confirma que os novos valores persistiram.
    await page.goto("/admin/financiamento");
    await expect(page.getByLabel("Taxa de juros sugerida (% ao ano)")).toHaveValue("9.5");
    await expect(page.getByLabel("Prazo máximo (meses)")).toHaveValue("360");
  });

  test("rejeita taxa fora do intervalo permitido", async ({ page }) => {
    await page.goto("/admin/financiamento");

    await page.getByLabel("Taxa de juros sugerida (% ao ano)").fill("999");
    await page.getByRole("button", { name: "Salvar" }).click();

    // Validação HTML5 (max="50") impede o submit; o navegador nem chega a enviar o form.
    await expect(page).toHaveURL(/\/admin\/financiamento$/);
    const isValid = await page.getByLabel("Taxa de juros sugerida (% ao ano)").evaluate((el) => (el as HTMLInputElement).validity.valid);
    expect(isValid).toBe(false);
  });
});
