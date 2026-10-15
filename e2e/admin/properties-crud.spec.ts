import path from "path";
import { test, expect } from "@playwright/test";
import { ADMIN_STORAGE_STATE } from "../auth-storage";
import { prisma } from "../db";

const FIXTURE_IMAGE = path.resolve(__dirname, "../fixtures/foto-teste.jpg");

test.use({ storageState: ADMIN_STORAGE_STATE });

test.describe("Admin — cadastro de imóveis", () => {
  test("cria um imóvel com upload de foto e ele aparece no site público", async ({ page }) => {
    const title = `Imóvel Criado via E2E ${Date.now()}`;

    await page.goto("/admin/imoveis/novo");
    await page.getByLabel("Título").fill(title);
    await page.getByLabel("Descrição").fill("Descrição de teste criada pela suíte E2E, com mais de dez caracteres.");
    await page.getByLabel("Preço").fill("45000000"); // CurrencyInput: dígitos = centavos → R$ 450.000,00
    await page.getByLabel("Área (m²)").fill("88");
    await page.getByLabel("Quartos").fill("3");
    await page.getByLabel("Banheiros").fill("2");
    await page.getByLabel("Cidade").fill("Cidade Criada E2E");
    await page.getByLabel("Bairro").fill("Bairro Criado");
    await page.getByLabel("Endereço").fill("Rua Criada pelo Teste, 1");

    await page.locator("input[type='file']").setInputFiles(FIXTURE_IMAGE);
    await expect(page.getByRole("button", { name: "Remover imagem 1" })).toBeVisible({ timeout: 15_000 });

    await page.getByRole("button", { name: "Salvar imóvel" }).click();

    await expect(page).toHaveURL(/\/admin\/imoveis\/.+\/editar\?created=1/);
    await expect(page.getByText("Imóvel cadastrado com sucesso.")).toBeVisible();

    const created = await prisma.property.findFirst({ where: { title } });
    expect(created).not.toBeNull();
    expect(created?.images.length).toBe(1);
    expect(created?.status).toBe("AVAILABLE");

    await page.goto(`/imoveis/${created!.code}`);
    await expect(page.getByRole("heading", { name: title })).toBeVisible();
  });

  test("edita um imóvel: mudar o status para vendido some da listagem pública mas mantém a página acessível", async ({ page }) => {
    const property = await prisma.property.create({
      data: {
        title: `Imóvel para Editar ${Date.now()}`,
        description: "Imóvel criado direto no banco para o teste de edição.",
        price: 300000,
        type: "APARTMENT",
        transactionType: "SALE",
        bedrooms: 2,
        bathrooms: 1,
        area: 60,
        city: "Cidade Edição E2E",
        neighborhood: "Bairro Edição",
        address: "Rua da Edição, 1",
        images: ["/uploads/e2e/edicao-1.svg"]
      }
    });

    await page.goto(`/admin/imoveis/${property.id}/editar`);
    await page.getByLabel("Status").selectOption("SOLD");
    await page.getByRole("button", { name: "Salvar imóvel" }).click();
    await expect(page.getByText("Imóvel atualizado com sucesso.")).toBeVisible();

    await page.goto(`/imoveis?city=${encodeURIComponent("Cidade Edição E2E")}`);
    await expect(page.getByText(property.title)).toHaveCount(0);

    await page.goto(`/imoveis/${property.code}`);
    await expect(page.getByText("Este imóvel já foi vendido.")).toBeVisible();
  });

  test("duplica um imóvel: a cópia nasce como rascunho com código novo", async ({ page }) => {
    const property = await prisma.property.create({
      data: {
        title: `Imóvel para Duplicar ${Date.now()}`,
        description: "Imóvel criado direto no banco para o teste de duplicação.",
        price: 400000,
        type: "HOUSE",
        transactionType: "SALE",
        bedrooms: 3,
        bathrooms: 2,
        area: 120,
        city: "Cidade Duplicação E2E",
        neighborhood: "Bairro Duplicação",
        address: "Rua da Duplicação, 1",
        images: ["/uploads/e2e/duplicacao-1.svg"]
      }
    });

    await page.goto("/admin/imoveis");
    const row = page.locator("tr", { hasText: property.title });
    await row.getByRole("button", { name: "Duplicar" }).click();

    await expect(page).toHaveURL(/\/admin\/imoveis\/.+\/editar\?duplicated=1/);
    await expect(page.getByText(/Cópia criada como/)).toBeVisible();

    const copy = await prisma.property.findFirst({ where: { title: `${property.title} (cópia)` } });
    expect(copy).not.toBeNull();
    expect(copy?.status).toBe("DRAFT");
    expect(copy?.code).not.toBe(property.code);
  });

  test("exclui um imóvel: some do admin e do site, e o lead vinculado não é apagado", async ({ page }) => {
    const property = await prisma.property.create({
      data: {
        title: `Imóvel para Excluir ${Date.now()}`,
        description: "Imóvel criado direto no banco para o teste de exclusão.",
        price: 250000,
        type: "APARTMENT",
        transactionType: "SALE",
        bedrooms: 1,
        bathrooms: 1,
        area: 40,
        city: "Cidade Exclusão E2E",
        neighborhood: "Bairro Exclusão",
        address: "Rua da Exclusão, 1",
        images: ["/uploads/e2e/exclusao-1.svg"]
      }
    });
    const lead = await prisma.lead.create({
      data: { propertyId: property.id, name: "Lead do Imóvel Excluído", email: "lead-excluido@example.com", phone: "11999990000" }
    });

    await page.goto("/admin/imoveis");
    const row = page.locator("tr", { hasText: property.title });
    page.once("dialog", (dialog) => dialog.accept());
    await row.getByRole("button", { name: "Deletar" }).click();

    await expect(page.locator("tr", { hasText: property.title })).toHaveCount(0);

    const stillExists = await prisma.property.findUnique({ where: { id: property.id } });
    expect(stillExists).toBeNull();

    const survivingLead = await prisma.lead.findUnique({ where: { id: lead.id } });
    expect(survivingLead).not.toBeNull();
    expect(survivingLead?.propertyId).toBeNull();
  });

  test("lista do admin filtra por status e por busca de título/código", async ({ page }) => {
    await page.goto("/admin/imoveis?status=DRAFT");
    await expect(page.getByText("Terreno E2E rascunho")).toBeVisible();
    await expect(page.getByText("Apartamento E2E disponível")).toHaveCount(0);

    await page.goto("/admin/imoveis?q=1001");
    await expect(page.getByText("Apartamento E2E disponível")).toBeVisible();
  });
});
