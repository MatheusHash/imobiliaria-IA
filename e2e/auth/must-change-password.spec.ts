import { test, expect } from "@playwright/test";
import { prisma } from "../db";
import { hashPassword } from "../../lib/auth";

// Cada teste cria o seu próprio usuário "nunca logado" com mustChangePassword: true —
// evita compartilhar (e corromper, por rodarem em paralelo) um único usuário de senha
// provisória entre os testes, já que o 3º teste muda a senha permanentemente.
async function createFreshUserWithProvisionalPassword(password: string) {
  return prisma.user.create({
    data: {
      name: "Corretor Senha Provisória E2E",
      email: `e2e-senha-provisoria-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
      passwordHash: hashPassword(password),
      role: "CORRETOR",
      mustChangePassword: true
    }
  });
}

test.use({ storageState: { cookies: [], origins: [] } });

test.describe("Troca de senha obrigatória no primeiro acesso", () => {
  test("login força ida para /conta e bloqueia navegação direta ao admin até trocar a senha", async ({ page }) => {
    const password = "senha-provisoria-abc";
    const user = await createFreshUserWithProvisionalPassword(password);

    await page.goto("/login");
    await page.getByLabel("E-mail").fill(user.email);
    await page.getByLabel("Senha").fill(password);
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page).toHaveURL(/\/conta\?primeiro-acesso=1/);
    await expect(page.getByText("Primeiro acesso:")).toBeVisible();

    // Tentar pular direto para o admin pela URL não funciona: volta para /conta.
    await page.goto("/admin/imoveis");
    await expect(page).toHaveURL(/\/conta\?primeiro-acesso=1/);
  });

  test("senha atual incorreta é rejeitada", async ({ page }) => {
    const password = "senha-provisoria-def";
    const user = await createFreshUserWithProvisionalPassword(password);

    await page.goto("/login");
    await page.getByLabel("E-mail").fill(user.email);
    await page.getByLabel("Senha").fill(password);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page).toHaveURL(/\/conta/);

    await page.getByLabel("Senha atual").fill("senha-errada");
    await page.getByLabel("Nova senha", { exact: true }).fill("nova-senha-valida-123");
    await page.getByLabel("Confirme a nova senha").fill("nova-senha-valida-123");
    await page.getByRole("button", { name: "Alterar senha" }).click();

    await expect(page.getByText("Senha atual incorreta")).toBeVisible();
  });

  test("troca a senha com sucesso e passa a acessar o admin normalmente", async ({ page }) => {
    const password = "senha-provisoria-ghi";
    const user = await createFreshUserWithProvisionalPassword(password);

    await page.goto("/login");
    await page.getByLabel("E-mail").fill(user.email);
    await page.getByLabel("Senha").fill(password);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page).toHaveURL(/\/conta/);

    const newPassword = "nova-senha-definitiva-123";
    await page.getByLabel("Senha atual").fill(password);
    await page.getByLabel("Nova senha", { exact: true }).fill(newPassword);
    await page.getByLabel("Confirme a nova senha").fill(newPassword);
    await page.getByRole("button", { name: "Alterar senha" }).click();

    await expect(page).toHaveURL(/\/admin\/imoveis$/);

    // Login de novo com a senha nova confirma que foi persistida e que mustChangePassword caiu.
    // Precisa sair da sessão atual antes: /login redireciona direto se já estiver autenticado.
    await page.context().clearCookies();
    await page.goto("/login");
    await page.getByLabel("E-mail").fill(user.email);
    await page.getByLabel("Senha").fill(newPassword);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page).toHaveURL(/\/admin\/imoveis$/);
  });
});
