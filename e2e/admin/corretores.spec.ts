import { test, expect } from "@playwright/test";
import { ADMIN_STORAGE_STATE } from "../auth-storage";
import { prisma } from "../db";
// Funções de hash de lib/auth.ts são puras (não usam next/headers) e seguras de importar aqui.
import { hashPassword } from "../../lib/auth";

test.use({ storageState: ADMIN_STORAGE_STATE });

test.describe("Admin — corretores", () => {
  test("cria um corretor com senha provisória", async ({ page }) => {
    const email = `e2e-corretor-criado-${Date.now()}@example.com`;

    await page.goto("/admin/corretores/novo");
    await page.getByLabel("Nome").fill("Corretor Criado via E2E");
    await page.getByLabel("E-mail").fill(email);
    await page.getByLabel("Senha provisória").fill("senha-provisoria-999");
    await page.getByRole("button", { name: "Cadastrar corretor" }).click();

    await expect(page).toHaveURL(/\/admin\/corretores\?created=1/);
    await expect(page.getByText("Corretor cadastrado.")).toBeVisible();

    const user = await prisma.user.findUnique({ where: { email } });
    expect(user).not.toBeNull();
    expect(user?.role).toBe("CORRETOR");
    expect(user?.mustChangePassword).toBe(true);

    const row = page.locator("tr", { hasText: email });
    await expect(row.getByText("Senha provisória")).toBeVisible();
  });

  test("rejeita e-mail duplicado", async ({ page }) => {
    await page.goto("/admin/corretores/novo");
    await page.getByLabel("Nome").fill("Duplicado");
    await page.getByLabel("E-mail").fill("e2e-corretor@primelar.com"); // já existe (seed)
    await page.getByLabel("Senha provisória").fill("qualquer-senha-123");
    await page.getByRole("button", { name: "Cadastrar corretor" }).click();

    await expect(page.getByText("Este e-mail já está cadastrado")).toBeVisible();
  });

  test("desativa um corretor e ele não consegue mais entrar", async ({ page }) => {
    const email = `e2e-corretor-desativar-${Date.now()}@example.com`;
    const password = "senha-provisoria-999";
    const user = await prisma.user.create({
      data: { name: "Corretor Para Desativar", email, passwordHash: hashPassword(password), role: "CORRETOR" }
    });

    await page.goto(`/admin/corretores/${user.id}/editar`);
    await page.getByLabel("Corretor ativo (desmarque para bloquear o acesso)").uncheck();
    await page.getByRole("button", { name: "Salvar alterações" }).click();
    await expect(page.getByText("Corretor atualizado.")).toBeVisible();

    await expect.poll(async () => (await prisma.user.findUnique({ where: { id: user.id } }))?.active).toBe(false);

    // Sai da sessão de admin (mesma página/contexto) para testar o login do corretor desativado.
    await page.context().clearCookies();
    await page.goto("/login");
    await page.getByLabel("E-mail").fill(email);
    await page.getByLabel("Senha").fill(password);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page.getByText(/desativado/i)).toBeVisible();
  });

  test("redefine a senha de um corretor (nova senha provisória)", async ({ page }) => {
    const email = `e2e-corretor-resetar-${Date.now()}@example.com`;
    const oldPassword = "senha-antiga-123";
    const newPassword = "senha-nova-456";
    const user = await prisma.user.create({
      data: { name: "Corretor Para Resetar", email, passwordHash: hashPassword(oldPassword), role: "CORRETOR" }
    });

    await page.goto(`/admin/corretores/${user.id}/editar`);
    await page.getByLabel("Nova senha provisória (opcional)").fill(newPassword);
    await page.getByRole("button", { name: "Salvar alterações" }).click();
    await expect(page.getByText(/senha provisória deverá ser trocada/)).toBeVisible();

    await expect.poll(async () => (await prisma.user.findUnique({ where: { id: user.id } }))?.mustChangePassword).toBe(true);

    await page.context().clearCookies();
    await page.goto("/login");
    await page.getByLabel("E-mail").fill(email);
    await page.getByLabel("Senha").fill(newPassword);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page).toHaveURL(/\/conta/);
  });
});
