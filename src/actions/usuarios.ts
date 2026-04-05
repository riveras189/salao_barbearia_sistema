"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { hash } from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function valorTexto(formData: FormData, campo: string) {
  return String(formData.get(campo) ?? "").trim();
}

function valorOpcional(formData: FormData, campo: string) {
  const valor = String(formData.get(campo) ?? "").trim();
  return valor ? valor : null;
}

export async function createUsuarioAction(formData: FormData) {
  const auth = await requireUser();

  const nome = valorTexto(formData, "nome");
  const email = valorOpcional(formData, "email");
  const login = valorTexto(formData, "login");
  const senha = valorTexto(formData, "senha");
  const papelBase = valorTexto(formData, "papelBase");
  const funcionarioId = valorOpcional(formData, "funcionarioId");
  const profissionalId = valorOpcional(formData, "profissionalId");
  const ativo = formData.get("ativo") === "on";

  if (!nome) throw new Error("Informe o nome.");
  if (!login) throw new Error("Informe o login.");
  if (!senha) throw new Error("Informe a senha.");
  if (!papelBase) throw new Error("Selecione o papel.");

  const loginExistente = await prisma.usuario.findFirst({
    where: {
      empresaId: auth.empresaId,
      login,
    },
  });

  if (loginExistente) {
    throw new Error("Já existe um usuário com esse login.");
  }

  const senhaHash = await hash(senha, 10);

  await prisma.usuario.create({
    data: {
      empresaId: auth.empresaId,
      nome,
      email,
      login,
      senhaHash,
      papelBase: papelBase as any,
      funcionarioId,
      profissionalId,
      ativo,
    },
  });

  revalidatePath("/usuarios");
  redirect("/usuarios");
}

export async function desativarUsuarioAction(usuarioId: string) {
  const auth = await requireUser();

  if (auth.id === usuarioId) {
    throw new Error("Você não pode desativar seu próprio usuário.");
  }

  const usuario = await prisma.usuario.findFirst({
    where: {
      id: usuarioId,
      empresaId: auth.empresaId,
    },
  });

  if (!usuario) {
    throw new Error("Usuário não encontrado.");
  }

  if (!usuario.ativo) {
    throw new Error("Este usuário já está desativado.");
  }

  await prisma.usuario.update({
    where: { id: usuarioId },
    data: {
      ativo: false,
      desativadoEm: new Date(),
      desativadoPorId: auth.id,
      motivoDesativacao: "Desativado manualmente pelo administrador.",
    },
  });

  revalidatePath("/usuarios");
}

export async function updateUsuarioAction(usuarioId: string, formData: FormData) {
  const auth = await requireUser();

  const nome = valorTexto(formData, "nome");
  const email = valorOpcional(formData, "email");
  const login = valorTexto(formData, "login");
  const senha = valorTexto(formData, "senha");
  const papelBase = valorTexto(formData, "papelBase");
  const funcionarioId = valorOpcional(formData, "funcionarioId");
  const profissionalId = valorOpcional(formData, "profissionalId");
  const ativo = formData.get("ativo") === "on";

  if (!nome) throw new Error("Informe o nome.");
  if (!login) throw new Error("Informe o login.");
  if (!papelBase) throw new Error("Selecione o papel.");

  const usuarioAtual = await prisma.usuario.findFirst({
    where: {
      id: usuarioId,
      empresaId: auth.empresaId,
    },
  });

  if (!usuarioAtual) {
    throw new Error("Usuário não encontrado.");
  }

  const loginExistente = await prisma.usuario.findFirst({
    where: {
      empresaId: auth.empresaId,
      login,
      NOT: { id: usuarioId },
    },
  });

  if (loginExistente) {
    throw new Error("Já existe outro usuário com esse login.");
  }

  const data: any = {
    nome,
    email,
    login,
    papelBase: papelBase as any,
    funcionarioId,
    profissionalId,
    ativo,
  };

  if (senha) {
    data.senhaHash = await hash(senha, 10);
  }

  if (!ativo && usuarioAtual.ativo) {
    data.desativadoEm = new Date();
    data.desativadoPorId = auth.id;
    data.motivoDesativacao = "Desativado na edição do usuário.";
  }

  if (ativo) {
    data.desativadoEm = null;
    data.desativadoPorId = null;
    data.motivoDesativacao = null;
  }

  await prisma.usuario.update({
    where: { id: usuarioId },
    data,
  });

  revalidatePath("/usuarios");
  revalidatePath(`/usuarios/${usuarioId}/editar`);
  redirect("/usuarios");
}