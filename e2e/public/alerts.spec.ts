import { test, expect } from "@playwright/test";
import { prisma } from "../db";

test.describe("Alerta de novos imóveis", () => {
  test("cadastra, confirma e cancela um alerta de busca", async ({ page }) => {
    const email = `e2e-alert-${Date.now()}@example.com`;

    await page.goto("/imoveis?city=Cidade+E2E");
    await page.getByRole("button", { name: "Me avise de novos imóveis assim" }).click();

    await page.getByPlaceholder("seu@email.com").fill(email);
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Quero ser avisado" }).click();

    await expect(page.getByText(/Confira seu e-mail para confirmar o alerta/i)).toBeVisible();

    const alert = await prisma.propertyAlert.findFirst({ where: { email } });
    expect(alert).not.toBeNull();
    expect(alert?.confirmed).toBe(false);

    await page.goto(`/alertas/confirmar?token=${alert!.confirmToken}`);
    await expect(page.getByRole("heading", { name: "Alerta confirmado!" })).toBeVisible();

    const confirmedAlert = await prisma.propertyAlert.findUnique({ where: { id: alert!.id } });
    expect(confirmedAlert?.confirmed).toBe(true);

    await page.goto(`/alertas/cancelar?token=${alert!.cancelToken}`);
    await expect(page.getByRole("heading", { name: "Cancelar alerta" })).toBeVisible();
    await page.getByRole("button", { name: "Cancelar alerta" }).click();

    await expect(page.getByText("Alerta cancelado. Você não vai mais receber esses e-mails.")).toBeVisible();

    const canceledAlert = await prisma.propertyAlert.findUnique({ where: { id: alert!.id } });
    expect(canceledAlert?.active).toBe(false);
  });

  test("link de confirmação inválido mostra mensagem de erro", async ({ page }) => {
    await page.goto("/alertas/confirmar?token=token-que-nao-existe");
    await expect(page.getByRole("heading", { name: "Link inválido" })).toBeVisible();
  });

  test("link de cancelamento inválido mostra mensagem de erro", async ({ page }) => {
    await page.goto("/alertas/cancelar?token=token-que-nao-existe");
    await expect(page.getByRole("heading", { name: "Link inválido" })).toBeVisible();
  });

  test("alerta já cancelado mostra aviso em vez do botão de cancelar", async ({ page }) => {
    // Nome do e-mail de propósito sem a palavra "cancelado": ela aparece na própria página
    // (no "enviado para {email}") e colidiria com a asserção abaixo que procura esse texto.
    const email = `e2e-alert-dupla-tentativa-${Date.now()}@example.com`;

    await page.goto("/imoveis?city=Cidade+E2E");
    await page.getByRole("button", { name: "Me avise de novos imóveis assim" }).click();
    await page.getByPlaceholder("seu@email.com").fill(email);
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Quero ser avisado" }).click();
    await expect(page.getByText(/Confira seu e-mail para confirmar o alerta/i)).toBeVisible();

    const alert = await prisma.propertyAlert.findFirst({ where: { email } });
    if (!alert) throw new Error("Alerta não foi criado");

    await page.goto(`/alertas/cancelar?token=${alert.cancelToken}`);
    await page.getByRole("button", { name: "Cancelar alerta" }).click();
    await expect(page.getByText("Alerta cancelado. Você não vai mais receber esses e-mails.")).toBeVisible();
    await expect.poll(async () => (await prisma.propertyAlert.findUnique({ where: { id: alert.id } }))?.active).toBe(false);

    // Visita o mesmo link de novo: o alerta já está inativo, não deve oferecer cancelar de novo.
    await page.goto(`/alertas/cancelar?token=${alert.cancelToken}`);
    await expect(page.getByText("Este alerta já estava cancelado.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Cancelar alerta" })).toHaveCount(0);
  });
});
