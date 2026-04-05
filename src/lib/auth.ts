import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHmac, timingSafeEqual } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { PapelBaseUsuario } from "@prisma/client";

const COOKIE_NAME = "salao_session";
const SESSION_TTL_SECONDS = 60 * 60 * 12;

type SessionPayload = {
  uid: string;
  eid: string;
  exp: number;
};

export type SessionUser = {
  id: string;
  empresaId: string;
  nome: string;
  login: string;
  email: string | null;
  papelBase: PapelBaseUsuario;
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

    if (!payload?.uid || !payload?.eid || !payload?.exp) return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;

    return payload;
  } catch {
    return null;
  }
}

async function setSessionCookie(user: { id: string; empresaId: string }) {
  const jar = await cookies();

  const payload: SessionPayload = {
    uid: user.id,
    eid: user.empresaId,
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

async function ensureDevAdmin(normalized: string, senha: string) {
  if (process.env.NODE_ENV === "production") return null;

  const isAdminLogin =
    normalized === "admin" || normalized === "admin@salao.local";

  if (!isAdminLogin || senha !== "123456") {
    return null;
  }

  let empresa = await prisma.empresa.findFirst({
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });

  if (!empresa) {
    empresa = await prisma.empresa.create({
      data: {
        razaoSocial: "Riveras Barbearia Ltda",
        nomeFantasia: "Riveras Barbearia",
        ativo: true,
      },
      select: { id: true },
    });
  }

  const senhaHash = await bcrypt.hash("123456", 10);

  const user = await prisma.usuario.upsert({
    where: {
      empresaId_login: {
        empresaId: empresa.id,
        login: "admin",
      },
    },
    update: {
      nome: "Administrador",
      email: "admin@salao.local",
      senhaHash,
      papelBase: PapelBaseUsuario.ADMIN,
      ativo: true,
      desativadoEm: null,
      desativadoPorId: null,
      motivoDesativacao: null,
    },
    create: {
      empresaId: empresa.id,
      nome: "Administrador",
      email: "admin@salao.local",
      login: "admin",
      senhaHash,
      papelBase: PapelBaseUsuario.ADMIN,
      ativo: true,
    },
    select: {
      id: true,
      empresaId: true,
      nome: true,
      login: true,
      email: true,
      senhaHash: true,
      papelBase: true,
    },
  });

  return user;
}

export async function clearSession() {
  const jar = await cookies();
  jar.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  const user = await prisma.usuario.findUnique({
    where: { id: payload.uid },
    select: {
      id: true,
      empresaId: true,
      nome: true,
      login: true,
      email: true,
      papelBase: true,
      ativo: true,
    },
  });

  if (!user || !user.ativo) return null;

  return {
    id: user.id,
    empresaId: user.empresaId,
    nome: user.nome,
    login: user.login,
    email: user.email,
    papelBase: user.papelBase,
  };
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

export async function loginWithCredentials(login: string, senha: string) {
  const normalized = String(login || "").trim().toLowerCase();

  let user = await prisma.usuario.findFirst({
    where: {
      ativo: true,
      OR: [{ login: normalized }, { email: normalized }],
    },
    select: {
      id: true,
      empresaId: true,
      nome: true,
      login: true,
      email: true,
      senhaHash: true,
      papelBase: true,
    },
  });

  if (!user) {
    user = await ensureDevAdmin(normalized, senha);
  }

  if (!user) {
    return { ok: false, error: "Usuário ou senha inválidos." };
  }

  let valid = false;

  try {
    valid = await bcrypt.compare(senha, user.senhaHash);
  } catch {
    valid = false;
  }

  if (!valid) {
    const repairedUser = await ensureDevAdmin(normalized, senha);

    if (repairedUser) {
      user = repairedUser;
      valid = true;
    }
  }

  if (!valid) {
    return { ok: false, error: "Usuário ou senha inválidos." };
  }

  await setSessionCookie({
    id: user.id,
    empresaId: user.empresaId,
  });

  await prisma.usuario.update({
    where: { id: user.id },
    data: { ultimoLoginEm: new Date() },
  });

  return { ok: true };
}
