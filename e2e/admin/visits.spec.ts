import { test, expect } from "@playwright/test";
import { ADMIN_STORAGE_STATE, CORRETOR_STORAGE_STATE } from "../auth-storage";
import { E2E_CORRETOR, E2E_NOVO_CORRETOR } from "../credentials";
import { prisma } from "../db";

async function userId(email: string) {
  return (await prisma.user.findUniqueOrThrow({ where: { email } })).id;
}

test.describe("Admin — disponibilidade de visitas", () => {
  test.use({ storageState: ADMIN_STORAGE_STATE });

  test("adiciona, desativa e remove um horário de disponibilidade", async ({ page }) => {
    await page.goto("/admin/visitas/disponibilidade");

    await page.getByLabel("Dia da semana").selectOption("2"); // Terça
    await page.getByLabel("Das").fill("10:00");
    await page.getByLabel("Até").fill("12:00");
    await page.getByLabel("Duração (min)").fill("45");
    await page.getByRole("button", { name: "Adicionar horário" }).click();

    await expect(page.getByText("Horário adicionado.")).toBeVisible();
    const row = page.locator("tr", { hasText: "Terça" }).filter({ hasText: "45 min" });
    await expect(row).toBeVisible();

    const rule = await prisma.visitSlotRule.findFirstOrThrow({ where: { weekday: 2, slotMinutes: 45 } });

    await row.getByLabel("Ativo").uncheck();
    await expect.poll(async () => (await prisma.visitSlotRule.findUnique({ where: { id: rule.id } }))?.active).toBe(false);

    page.once("dialog", (dialog) => dialog.accept());
    await row.getByRole("button", { name: "Remover" }).click();

    await expect(page.locator("tr", { hasText: "Terça" }).filter({ hasText: "45 min" })).toHaveCount(0);
    expect(await prisma.visitSlotRule.findUnique({ where: { id: rule.id } })).toBeNull();
  });
});

test.describe("Agendamento de visita", () => {
  test("visitante agenda uma visita e ela aparece no admin para ser confirmada", async ({ page, browser }) => {
    const visitorEmail = `e2e-visitante-${Date.now()}@example.com`;

    await page.goto("/imoveis/1001");
    const visitForm = page.locator("form").filter({ has: page.locator("input[name='scheduledFor']") });
    await visitForm.locator("div.mt-4 button").first().click();

    await visitForm.getByLabel("Nome").fill("Visitante Agendador E2E");
    await visitForm.getByLabel("E-mail").fill(visitorEmail);
    await visitForm.getByLabel("Telefone / WhatsApp").fill("11966665555");
    await visitForm.getByRole("checkbox").check();
    await visitForm.getByRole("button", { name: "Confirmar agendamento" }).click();

    await expect(page.getByText("Visita agendada!")).toBeVisible();

    const visit = await prisma.visit.findFirstOrThrow({ where: { visitorEmail } });
    expect(visit.status).toBe("PENDING");

    const context = await browser.newContext({ storageState: ADMIN_STORAGE_STATE });
    const adminPage = await context.newPage();
    await adminPage.goto("/admin/visitas");

    const article = adminPage.locator("article", { hasText: visitorEmail });
    await expect(article).toBeVisible();
    await article.getByRole("combobox", { name: "Status da visita" }).selectOption("CONFIRMED");
    await article.getByRole("button", { name: "Salvar" }).click();

    await expect.poll(async () => (await prisma.visit.findUnique({ where: { id: visit.id } }))?.status).toBe("CONFIRMED");
    await context.close();
  });

  test("horário já ocupado não aparece como opção (evita conflito de agenda)", async ({ page }) => {
    // Cria a visita ocupando o horário direto no banco (em vez de reservar via UI, o que
    // colidiria em paralelo com o teste acima disputando o mesmo "primeiro horário livre")
    // e confirma que a UI não oferece mais esse horário específico.
    const property = await prisma.property.findFirstOrThrow({ where: { code: 1001 } });
    const bookedSlot = new Date();
    bookedSlot.setDate(bookedSlot.getDate() + 1);
    bookedSlot.setHours(10, 0, 0, 0);

    await prisma.visit.create({
      data: {
        propertyId: property.id,
        scheduledFor: bookedSlot,
        visitorName: "Visitante Bloqueador",
        visitorEmail: `e2e-visitante-bloqueador-${Date.now()}@example.com`,
        visitorPhone: "11900000000"
      }
    });

    const dayLabel = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(bookedSlot);

    await page.goto("/imoveis/1001");
    const visitForm = page.locator("form").filter({ has: page.locator("input[name='scheduledFor']") });
    await visitForm.getByRole("button", { name: dayLabel }).click();

    await expect(visitForm.locator("div.mt-4 button", { hasText: "10:00" })).toHaveCount(0);
  });
});

test.describe("Admin — isolamento de visitas por papel", () => {
  test("corretor só vê visitas sem responsável ou atribuídas a ele", async ({ browser }) => {
    const corretorId = await userId(E2E_CORRETOR.email);
    const outroId = await userId(E2E_NOVO_CORRETOR.email);
    const suffix = Date.now();
    const base = { scheduledFor: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), visitorPhone: "11977776666" };

    const unassigned = await prisma.visit.create({
      data: { ...base, visitorName: `Visita Sem Responsável ${suffix}`, visitorEmail: `v-sem-${suffix}@example.com` }
    });
    const mine = await prisma.visit.create({
      data: { ...base, visitorName: `Visita Minha ${suffix}`, visitorEmail: `v-minha-${suffix}@example.com`, assignedToId: corretorId }
    });
    const others = await prisma.visit.create({
      data: { ...base, visitorName: `Visita de Outro ${suffix}`, visitorEmail: `v-outro-${suffix}@example.com`, assignedToId: outroId }
    });

    const context = await browser.newContext({ storageState: CORRETOR_STORAGE_STATE });
    const page = await context.newPage();
    await page.goto("/admin/visitas");

    await expect(page.getByText(unassigned.visitorName)).toBeVisible();
    await expect(page.getByText(mine.visitorName)).toBeVisible();
    await expect(page.getByText(others.visitorName)).toHaveCount(0);

    await context.close();
  });
});
