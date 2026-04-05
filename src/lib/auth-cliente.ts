import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHmac, timingSafeEqual } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const COOKIE_NAME = "cliente_portal_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

type SessionPayload = {
  cid: string;
  eid: string;
  exp: number;
};

export type ClienteSessionUser = {
  clienteId: string;
  empresaId: string;
  nome: string;
  login: string;
};

function getAuthSecret() {
  return process.env.AUTH_SECRET || "dev-secret-change-me";
}

function toBase64Url(input: string | Buffer) {
  return Buffer.from(input)
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function fromBase64Url(input: string) {
  const base64 = input.replaceAll("-", "+").replaceAll("_", "/");
  const pad = base64.length % 4 === 0 ? "" : "=".repeat(4 - (base64.length % 4));
  return Buffer.from(base64 + pad, "base64");
}

function sign(value: string) {
  return toBase64Url(createHmac("sha256", getAuthSecret()).update(value).digest());
}

function createToken(payload: SessionPayload) {
  const encoded = toBase64Url(JSON.stringify(payload));
  const signature = sign(encoded);
  return `${encoded}.${signature}`;
}

function verifyToken(token: string): SessionPayload | null {
  try {
    const [encoded, signature] = token.split(".");
    if (!encoded || !signature) return null;

    const expected = sign(encoded);
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);

    if (a.length !== b.length) return null;
    if (!timingSafeEqual(a, b)) return null;

    const payload = JSON.parse(fromBase64Url(encoded).toString("utf8")) as SessionPayload;

    if (!payload?.cid || !payload?.eid || !payload?.exp) return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;

    return payload;
  } catch {
    return null;
  }
}

async function setSessionCookie(cliente: { clienteId: string; empresaId: string }) {
  const jar = await cookies();

  const payload: SessionPayload = {
    cid: cliente.clienteId,
    eid: cliente.empresaId,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };

  jar.set(COOKIE_NAME, createToken(payload), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearClienteSession() {
  const jar = await cookies();
  jar.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function getClienteSessionUser(): Promise<ClienteSessionUser | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  const acesso = await prisma.clienteAcesso.findFirst({
    where: {
      clienteId: payload.cid,
      empresaId: payload.eid,
      ativo: true,
    },
    include: {
      cliente: {
        select: {
          id: true,
          nome: true,
        },
      },
    },
  });

  if (!acesso) return null;

  return {
    clienteId: acesso.cliente.id,
    empresaId: acesso.empresaId,
    nome: acesso.cliente.nome,
    login: acesso.login,
  };
}

export async function requireClienteUser() {
  const cliente = await getClienteSessionUser();
  if (!cliente) redirect("/cliente/login");
  return cliente;
}

export async function loginClienteWithCredentials(login: string, senha: string) {
  const normalized = String(login || "").trim().toLowerCase();

  const acesso = await prisma.clienteAcesso.findFirst({
    where: {
      ativo: true,
      login: normalized,
    },
    select: {
      clienteId: true,
      empresaId: true,
      senhaHash: true,
    },
  });

  if (!acesso) {
    return { ok: false, error: "Login ou senha inválidos." };
  }

  const valid = await bcrypt.compare(senha, acesso.senhaHash);

  if (!valid) {
    return { ok: false, error: "Login ou senha inválidos." };
  }

  await setSessionCookie({
    clienteId: acesso.clienteId,
    empresaId: acesso.empresaId,
  });

  await prisma.clienteAcesso.updateMany({
    where: {
      clienteId: acesso.clienteId,
      empresaId: acesso.empresaId,
    },
    data: {
      ultimoLoginEm: new Date(),
    },
  });

  return { ok: true };
}