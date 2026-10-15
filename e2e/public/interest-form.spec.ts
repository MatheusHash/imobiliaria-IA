import { test, expect } from "@playwright/test";
import { prisma } from "../db";

test.describe("Formulário de interesse (lead)", () => {
  test("validação impede envio com dados incompletos", async ({ page }) => {
    await page.goto("/imoveis/1001");

    await page.getByLabel("Nome").fill("Jo");
    await page.getByLabel("E-mail").fill("visitante@example.com");
    await page.getByLabel("Telefone / WhatsApp").fill("123");
    await page.getByRole("button", { name: "Enviar interesse" }).click();

    await expect(page.getByText("Revise os campos destacados.")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Tenho interesse" })).toBeVisible();
  });

  test("envia o formulário e cria um lead vinculado ao imóvel", async ({ page }) => {
    const email = `e2e-lead-${Date.now()}@example.com`;

    await page.goto("/imoveis/1001");

    await page.getByLabel("Nome").fill("Visitante E2E");
    await page.getByLabel("E-mail").fill(email);
    await page.getByLabel("Telefone / WhatsApp").fill("11999998888");
    await page.getByLabel("Mensagem").fill("Quero saber mais sobre este imóvel.");
    await page.getByRole("button", { name: "Enviar interesse" }).click();

    await expect(page.getByText(/Recebemos seu contato/i)).toBeVisible();

    const lead = await prisma.lead.findFirst({ where: { email } });
    expect(lead).not.toBeNull();
    expect(lead?.name).toBe("Visitante E2E");
  });
});
