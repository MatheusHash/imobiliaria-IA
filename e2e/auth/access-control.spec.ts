import { test, expect } from "@playwright/test";
import { ADMIN_STORAGE_STATE, CORRETOR_STORAGE_STATE } from "../auth-storage";

test.describe("Visitante anônimo", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("é redirecionado ao login ao tentar acessar o admin", async ({ page }) => {
    await page.goto("/admin/imoveis");
    await expect(page).toHaveURL(`/login?next=${encodeURIComponent("/admin/imoveis")}`);
  });

  test("é redirecionado ao login ao tentar acessar a gestão de corretores sem sessão", async ({ page }) => {
    // O layout /admin (app/admin/layout.tsx) checa a sessão antes de qualquer subpágina
    // e sempre usa "/admin/imoveis" como "next" padrão — por isso o destino não varia por rota.
    await page.goto("/admin/corretores");
    await expect(page).toHaveURL(`/login?next=${encodeURIComponent("/admin/imoveis")}`);
  });
});

test.describe("Corretor (não-admin)", () => {
  test.use({ storageState: CORRETOR_STORAGE_STATE });

  test("acessa a gestão de imóveis normalmente", async ({ page }) => {
    await page.goto("/admin/imoveis");
    await expect(page).toHaveURL(/\/admin\/imoveis$/);
    await expect(page.getByText("Autenticado como")).toBeVisible();
  });

  test("não vê o link 'Corretores' na navegação", async ({ page }) => {
    await page.goto("/admin/imoveis");
    await expect(page.getByRole("link", { name: "Corretores" })).toHaveCount(0);
  });

  test("é redirecionado para /admin/imoveis ao tentar acessar a gestão de corretores direto pela URL", async ({ page }) => {
    await page.goto("/admin/corretores");
    await expect(page).toHaveURL(/\/admin\/imoveis$/);
  });

  test("é redirecionado ao tentar acessar o cadastro de novo corretor", async ({ page }) => {
    await page.goto("/admin/corretores/novo");
    await expect(page).toHaveURL(/\/admin\/imoveis$/);
  });
});

test.describe("Administrador", () => {
  test.use({ storageState: ADMIN_STORAGE_STATE });

  test("vê o link 'Corretores' na navegação e acessa a gestão de equipe", async ({ page }) => {
    await page.goto("/admin/imoveis");
    await expect(page.getByRole("link", { name: "Corretores" })).toBeVisible();

    await page.getByRole("link", { name: "Corretores" }).click();
    await expect(page).toHaveURL(/\/admin\/corretores$/);
  });
});
