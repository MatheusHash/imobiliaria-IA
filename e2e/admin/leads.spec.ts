import { test, expect } from "@playwright/test";
import { ADMIN_STORAGE_STATE, CORRETOR_STORAGE_STATE } from "../auth-storage";
import { E2E_CORRETOR, E2E_NOVO_CORRETOR } from "../credentials";
import { prisma } from "../db";

async function userId(email: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { email } });
  return user.id;
}

test.describe("Admin — leads", () => {
  test("corretor só vê leads sem responsável ou atribuídos a ele, nunca os de outro corretor", async ({ browser }) => {
    const corretorId = await userId(E2E_CORRETOR.email);
    const outroCorretorId = await userId(E2E_NOVO_CORRETOR.email);
    const suffix = Date.now();

    const unassigned = await prisma.lead.create({
      data: { name: `Lead Sem Responsável ${suffix}`, email: `lead-sem-${suffix}@example.com`, phone: "11911110000" }
    });
    const mine = await prisma.lead.create({
      data: { name: `Lead Meu ${suffix}`, email: `lead-meu-${suffix}@example.com`, phone: "11911110001", assignedToId: corretorId }
    });
    const others = await prisma.lead.create({
      data: { name: `Lead de Outro ${suffix}`, email: `lead-outro-${suffix}@example.com`, phone: "11911110002", assignedToId: outroCorretorId }
    });

    const context = await browser.newContext({ storageState: CORRETOR_STORAGE_STATE });
    const page = await context.newPage();
    await page.goto("/admin/leads");

    await expect(page.getByText(unassigned.name)).toBeVisible();
    await expect(page.getByText(mine.name)).toBeVisible();
    await expect(page.getByText(others.name)).toHaveCount(0);

    await context.close();
  });

  test("admin vê todos os leads e pode atribuir um a um corretor", async ({ browser }) => {
    const corretorId = await userId(E2E_CORRETOR.email);
    const suffix = Date.now();
    const lead = await prisma.lead.create({
      data: { name: `Lead Para Atribuir ${suffix}`, email: `lead-atribuir-${suffix}@example.com`, phone: "11922220000" }
    });

    const context = await browser.newContext({ storageState: ADMIN_STORAGE_STATE });
    const page = await context.newPage();
    await page.goto("/admin/leads");

    const article = page.locator("article", { hasText: lead.name });
    await article.getByRole("combobox", { name: "Responsável" }).selectOption(corretorId);
    await article.getByRole("button", { name: "Atribuir" }).click();

    // O <select> mantém o valor que acabamos de escolher no DOM mesmo antes do servidor
    // confirmar — por isso a prova real é consultar o banco (com poll, pois a server action
    // roda de forma assíncrona), não reler o próprio <select> imediatamente após o clique.
    await expect.poll(async () => (await prisma.lead.findUnique({ where: { id: lead.id } }))?.assignedToId).toBe(corretorId);

    await page.reload();
    await expect(page.locator("article", { hasText: lead.name }).getByRole("combobox", { name: "Responsável" })).toHaveValue(corretorId);

    await context.close();
  });

  test("corretor assume um lead sem responsável", async ({ browser }) => {
    const corretorId = await userId(E2E_CORRETOR.email);
    const suffix = Date.now();
    const lead = await prisma.lead.create({
      data: { name: `Lead Para Assumir ${suffix}`, email: `lead-assumir-${suffix}@example.com`, phone: "11933330000" }
    });

    const context = await browser.newContext({ storageState: CORRETOR_STORAGE_STATE });
    const page = await context.newPage();
    await page.goto("/admin/leads");

    const article = page.locator("article", { hasText: lead.name });
    await article.getByRole("button", { name: "Assumir lead" }).click();

    await expect(page.locator("article", { hasText: lead.name }).getByRole("button", { name: "Assumir lead" })).toHaveCount(0);
    const updated = await prisma.lead.findUnique({ where: { id: lead.id } });
    expect(updated?.assignedToId).toBe(corretorId);

    await context.close();
  });

  test("muda o status de um lead", async ({ browser }) => {
    const suffix = Date.now();
    const lead = await prisma.lead.create({
      data: { name: `Lead Para Status ${suffix}`, email: `lead-status-${suffix}@example.com`, phone: "11944440000" }
    });

    const context = await browser.newContext({ storageState: ADMIN_STORAGE_STATE });
    const page = await context.newPage();
    await page.goto("/admin/leads");

    const article = page.locator("article", { hasText: lead.name });
    await article.getByRole("combobox", { name: "Status do lead" }).selectOption("CONVERTED");
    await article.getByRole("button", { name: "Salvar" }).click();

    await expect.poll(async () => (await prisma.lead.findUnique({ where: { id: lead.id } }))?.status).toBe("CONVERTED");

    await page.reload();
    // Escopo ao <span> do badge: a própria <option selecionada> também contém o texto
    // "Convertido" e causaria ambiguidade num getByText solto.
    await expect(page.locator("article", { hasText: lead.name }).locator("span", { hasText: "Convertido" })).toBeVisible();

    await context.close();
  });
});
