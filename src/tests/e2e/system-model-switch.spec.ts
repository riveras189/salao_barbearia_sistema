import "dotenv/config";
import { createHmac } from "node:crypto";
import { test, expect } from "@playwright/test";
import { Client } from "pg";

function toBase64Url(input: string | Buffer) {
  return Buffer.from(input)
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function sign(value: string, secret: string) {
  return toBase64Url(createHmac("sha256", secret).update(value).digest());
}

async function createAdminSessionCookie() {
  const connectionString = process.env.DATABASE_URL;
  const secret = process.env.AUTH_SECRET || "dev-secret-change-me";

  if (!connectionString) {
    throw new Error("DATABASE_URL não definida para o teste E2E");
  }

  const client = new Client({ connectionString });
  await client.connect();

  try {
    const result = await client.query<{ id: string; empresaId: string }>(
      'SELECT "id", "empresaId" FROM "Usuario" WHERE "login" = $1 AND "ativo" = true ORDER BY "createdAt" ASC LIMIT 1',
      ["admin"]
    );

    const admin = result.rows[0];

    if (!admin) {
      throw new Error("Usuário admin não encontrado para o teste E2E");
    }

    const payload = toBase64Url(
      JSON.stringify({
        uid: admin.id,
        eid: admin.empresaId,
        exp: Math.floor(Date.now() / 1000) + 60 * 60,
      })
    );

    return `${payload}.${sign(payload, secret)}`;
  } finally {
    await client.end();
  }
}

test("admin troca o modelo e a escolha persiste", async ({ page, context, baseURL }) => {
  const sessionCookie = await createAdminSessionCookie();
  const url = new URL(baseURL || "http://127.0.0.1:3001");

  await context.addCookies([
    {
      name: "salao_session",
      value: sessionCookie,
      domain: url.hostname,
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);

  await page.goto("/dashboard");
  await page.getByRole("button", { name: /modelo ativo/i }).click();
  await page.getByRole("button", { name: /selecionar modelo padrão/i }).click();

  await expect(page.locator("html")).toHaveAttribute("data-model", "padrao_v1");

  await page.reload();

  await expect(page.locator("html")).toHaveAttribute("data-model", "padrao_v1");
});
