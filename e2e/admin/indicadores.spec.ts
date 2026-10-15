import { test, expect } from "@playwright/test";
import { ADMIN_STORAGE_STATE } from "../auth-storage";
import { prisma } from "../db";

test.use({ storageState: ADMIN_STORAGE_STATE });

test.describe("Admin — painel de indicadores", () => {
  test("mostra um lead recém-criado e navega para a listagem filtrada pelo card", async ({ page }) => {
    const lead = await prisma.lead.create({
      data: { name: `Lead Indicadores ${Date.now()}`, email: `lead-indicadores-${Date.now()}@example.com`, phone: "11911112222" }
    });

    await page.goto("/admin");
    await expect(page.getByRole("heading", { name: "Imóveis mais vistos" })).toBeVisible();
    await expect(page.getByText(lead.name)).toBeVisible();

    await page.getByRole("link", { name: /Leads novos/ }).click();
    await expect(page).toHaveURL(/\/admin\/leads\?status=NEW/);
  });

  test("imóvel com visualizações aparece em 'Imóveis mais vistos'", async ({ page }) => {
    const property = await prisma.property.create({
      data: {
        title: `Imóvel Mais Visto ${Date.now()}`,
        description: "Imóvel de teste com visualizações para o painel de indicadores.",
        price: 300000,
        type: "APARTMENT",
        transactionType: "SALE",
        bedrooms: 2,
        bathrooms: 1,
        area: 60,
        city: "Cidade Indicadores E2E",
        neighborhood: "Centro",
        address: "Rua dos Indicadores, 1",
        images: ["/uploads/e2e/indicadores-1.svg"],
        viewCount: 42
      }
    });

    await page.goto("/admin");
    const row = page.locator("li", { hasText: property.title });
    await expect(row).toBeVisible();
    await expect(row.getByText("42")).toBeVisible();
  });
});
