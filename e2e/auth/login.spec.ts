import { test, expect } from "@playwright/test";
import { ADMIN_STORAGE_STATE } from "../auth-storage";
import { E2E_ADMIN, E2E_INACTIVE } from "../credentials";

test.describe("Login", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("credenciais válidas entram e vão para /admin/imoveis", async ({ page }) => {
    await page.goto("/login");

    await page.getByLabel("E-mail").fill(E2E_ADMIN.email);
    await page.getByLabel("Senha").fill(E2E_ADMIN.password);
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page).toHaveURL(/\/admin\/imoveis$/);
    await expect(page.getByText("Autenticado como Admin E2E")).toBeVisible();
  });

  test("respeita o parâmetro next após o login", async ({ page }) => {
    await page.goto("/login?next=%2Fadmin%2Fleads");

    await page.getByLabel("E-mail").fill(E2E_ADMIN.email);
    await page.getByLabel("Senha").fill(E2E_ADMIN.password);
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page).toHaveURL(/\/admin\/leads$/);
  });

  test("senha incorreta mostra mensagem de erro e permanece na tela de login", async ({ page }) => {
    await page.goto("/login");

    await page.getByLabel("E-mail").fill(E2E_ADMIN.email);
    await page.getByLabel("Senha").fill("senha-errada-123");
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page.getByText("E-mail ou senha inválidos.")).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("usuário desativado não consegue entrar", async ({ page }) => {
    await page.goto("/login");

    await page.getByLabel("E-mail").fill(E2E_INACTIVE.email);
    await page.getByLabel("Senha").fill(E2E_INACTIVE.password);
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page.getByText(/desativado/i)).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("link externo (next absoluto) é ignorado e usa o destino padrão", async ({ page }) => {
    await page.goto("/login?next=https%3A%2F%2Fevil.example.com");

    await page.getByLabel("E-mail").fill(E2E_ADMIN.email);
    await page.getByLabel("Senha").fill(E2E_ADMIN.password);
    await page.getByRole("button", { name: "Entrar" }).click();

    // LoginPage (app/login/page.tsx) já sanitiza o "next" inválido antes de colocá-lo no
    // formulário, então o redirect final cai no destino seguro padrão.
    await expect(page).toHaveURL(/\/admin\/imoveis$/);
  });
});

test.describe("Login quando já autenticado", () => {
  test.use({ storageState: ADMIN_STORAGE_STATE });

  test("acessar /login redireciona direto para a área administrativa", async ({ page }) => {
    await page.goto("/login");
    await expect(page).toHaveURL(/\/admin\/imoveis$/);
  });
});

test.describe("Logout", () => {
  test.use({ storageState: ADMIN_STORAGE_STATE });

  test("sair encerra a sessão e bloqueia novo acesso à área admin", async ({ page }) => {
    await page.goto("/admin/imoveis");
    await page.getByRole("button", { name: "Sair" }).click();

    await expect(page).toHaveURL(/\/login/);

    await page.goto("/admin/imoveis");
    await expect(page).toHaveURL(/\/login\?next=/);
  });
});
