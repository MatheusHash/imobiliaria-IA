import { test as setup, expect } from "@playwright/test";
import { ADMIN_STORAGE_STATE, CORRETOR_STORAGE_STATE } from "./auth-storage";
import { E2E_ADMIN, E2E_CORRETOR } from "./credentials";

async function loginViaUi(page: import("@playwright/test").Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/admin\/imoveis/);
}

setup("autenticar como admin", async ({ page }) => {
  await loginViaUi(page, E2E_ADMIN.email, E2E_ADMIN.password);
  await page.context().storageState({ path: ADMIN_STORAGE_STATE });
});

setup("autenticar como corretor", async ({ page }) => {
  await loginViaUi(page, E2E_CORRETOR.email, E2E_CORRETOR.password);
  await page.context().storageState({ path: CORRETOR_STORAGE_STATE });
});
