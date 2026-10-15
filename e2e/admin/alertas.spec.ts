import { test, expect } from "@playwright/test";
import { ADMIN_STORAGE_STATE } from "../auth-storage";
import { prisma } from "../db";

test.use({ storageState: ADMIN_STORAGE_STATE });

test.describe("Admin — alertas de novos imóveis", () => {
  test("lista um alerta cadastrado e permite desativá-lo manualmente", async ({ page }) => {
    const email = `e2e-alerta-admin-${Date.now()}@example.com`;
    const alert = await prisma.propertyAlert.create({
      data: {
        email,
        filters: { city: "Cidade E2E" },
        confirmToken: `confirm-${Date.now()}`,
        cancelToken: `cancel-${Date.now()}`,
        confirmed: true
      }
    });

    await page.goto("/admin/alertas");
    const row = page.locator("tr", { hasText: email });
    await expect(row).toBeVisible();
    await expect(row.getByText("Sim")).toBeVisible(); // coluna "Confirmado"

    await row.getByLabel("Ativo").uncheck();

    await expect.poll(async () => (await prisma.propertyAlert.findUnique({ where: { id: alert.id } }))?.active).toBe(false);
  });
});
