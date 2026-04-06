import { test, expect } from "@playwright/test";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("Login ou e-mail").fill("admin");
  await page.getByLabel("Senha").fill("123456");
  await page.getByRole("button", { name: "Entrar no painel" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

test("painel carrega rotas principais", async ({ page }) => {
  await login(page);

  await page.goto("/clientes");
  await expect(page).toHaveURL(/\/clientes/);

  await page.goto("/agenda");
  await expect(page).toHaveURL(/\/agenda/);

  await page.goto("/comandas");
  await expect(page).toHaveURL(/\/comandas/);

  await page.goto("/financeiro");
  await expect(page).toHaveURL(/\/financeiro/);
});
