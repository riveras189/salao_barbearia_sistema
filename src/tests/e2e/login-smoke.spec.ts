import { test, expect } from "@playwright/test";

test("admin consegue fazer login no painel", async ({ page }) => {
  await page.goto("/login");

  await page.getByLabel("Login ou e-mail").fill("admin");
  await page.getByLabel("Senha").fill("123456");
  await page.getByRole("button", { name: "Entrar no painel" }).click();

  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByText(/dashboard|visão geral|agenda/i).first()).toBeVisible();
});
