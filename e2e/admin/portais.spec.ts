import { test, expect } from "@playwright/test";
import { ADMIN_STORAGE_STATE } from "../auth-storage";
import { prisma } from "../db";

test.use({ storageState: ADMIN_STORAGE_STATE });

// Módulo "portais" é só esqueleto (ver docs/modulos.md, módulo 8): o formato real de
// integração ainda não foi decidido, então este é um smoke test da tela e do fluxo de
// status documentado, não um teste do formato de envio (que não existe ainda).
test.describe("Admin — integração com portais (esqueleto)", () => {
  test("marca um imóvel para um portal na edição e ele aparece em /admin/portais como pendente", async ({ page }) => {
    const property = await prisma.property.create({
      data: {
        title: `Imóvel Para Portal ${Date.now()}`,
        description: "Imóvel de teste para o fluxo de marcação de portais.",
        price: 280000,
        type: "APARTMENT",
        transactionType: "SALE",
        bedrooms: 2,
        bathrooms: 1,
        area: 55,
        city: "Cidade Portais E2E",
        neighborhood: "Centro",
        address: "Rua dos Portais, 1",
        images: ["/uploads/e2e/portais-1.svg"]
      }
    });

    await page.goto(`/admin/imoveis/${property.id}/editar`);
    await page.getByRole("checkbox", { name: "ZAP Imóveis" }).check();
    await page.getByRole("button", { name: "Salvar portais" }).click();

    // Form sem useActionState: o clique dispara o round-trip da server action, mas não há
    // mensagem de sucesso na tela para esperar — por isso o poll no banco em vez de um
    // findFirstOrThrow imediato (que corre risco de rodar antes do upsert terminar).
    await expect.poll(() => prisma.portalListing.findFirst({ where: { propertyId: property.id, portal: "ZAP" } })).not.toBeNull();
    const listing = await prisma.portalListing.findFirstOrThrow({ where: { propertyId: property.id, portal: "ZAP" } });
    expect(listing.enabled).toBe(true);
    expect(listing.status).toBe("PENDING");

    await page.goto("/admin/portais");
    const row = page.locator("tr", { hasText: property.title });
    await expect(row).toBeVisible();
    await expect(row.getByText("Pendente")).toBeVisible();
  });

  test("sincronizar termina em erro documentado (integração real ainda não definida)", async ({ page }) => {
    const property = await prisma.property.create({
      data: {
        title: `Imóvel Para Sincronizar ${Date.now()}`,
        description: "Imóvel de teste para o fluxo de sincronização com portal.",
        price: 280000,
        type: "APARTMENT",
        transactionType: "SALE",
        bedrooms: 2,
        bathrooms: 1,
        area: 55,
        city: "Cidade Portais E2E",
        neighborhood: "Centro",
        address: "Rua dos Portais, 2",
        images: ["/uploads/e2e/portais-2.svg"]
      }
    });
    await prisma.portalListing.create({ data: { propertyId: property.id, portal: "VIVAREAL", enabled: true } });

    await page.goto("/admin/portais");
    const row = page.locator("tr", { hasText: property.title });
    await row.getByRole("button", { name: "Sincronizar" }).click();

    await expect(row.getByText("Erro")).toBeVisible();
    await expect(row.getByText(/Integração ainda não configurada/)).toBeVisible();
  });
});
