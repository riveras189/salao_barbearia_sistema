"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import {
  getFirstFieldError,
  type FuncionarioActionState,
  parseFuncionarioFormData,
  toFuncionarioDbInput,
} from "@/schemas/funcionario";

export async function createFuncionarioAction(
  _prevState: FuncionarioActionState,
  formData: FormData
): Promise<FuncionarioActionState> {
  const user = await requireUser();
  const { fields, parsed } = parseFuncionarioFormData(formData);

  if (!parsed.success) {
    const flattened = parsed.error.flatten().fieldErrors;
    const fieldErrors = Object.fromEntries(
      Object.entries(flattened).map(([key, value]) => [key, value?.[0]])
    ) as FuncionarioActionState["fieldErrors"];

    return {
      error: getFirstFieldError(flattened),
      fieldErrors,
      fields,
    };
  }

  if (fields.cpf) {
    const duplicateCpf = await prisma.funcionario.findFirst({
      where: {
        empresaId: user.empresaId,
        cpf: fields.cpf.replace(/\D/g, ""),
      },
      select: { id: true },
    });

    if (duplicateCpf) {
      return {
        error: "Já existe um funcionário com este CPF.",
        fieldErrors: { cpf: "Já existe um funcionário com este CPF." },
        fields,
      };
    }
  }

  await prisma.funcionario.create({
    data: {
      empresaId: user.empresaId,
      ...toFuncionarioDbInput(fields),
      ativo: true,
    },
  });

  revalidatePath("/funcionarios");
  redirect("/funcionarios?ok=created");
}

export async function updateFuncionarioAction(
  _prevState: FuncionarioActionState,
  formData: FormData
): Promise<FuncionarioActionState> {
  const user = await requireUser();
  const id = String(formData.get("id") || "").trim();

  if (!id) {
    return {
      error: "Funcionário inválido.",
      fields: {
        nome: "",
        cpf: "",
        email: "",
        telefone: "",
        whatsapp: "",
        fotoUrl: "",
        cep: "",
        logradouro: "",
        numero: "",
        complemento: "",
        bairro: "",
        cidade: "",
        uf: "",
        dataAdmissao: "",
        dataDemissao: "",
        observacoes: "",
      },
    };
  }

  const existing = await prisma.funcionario.findFirst({
    where: {
      id,
      empresaId: user.empresaId,
    },
    select: { id: true },
  });

  if (!existing) {
    return {
      error: "Funcionário não encontrado.",
      fields: {
        nome: "",
        cpf: "",
        email: "",
        telefone: "",
        whatsapp: "",
        fotoUrl: "",
        cep: "",
        logradouro: "",
        numero: "",
        complemento: "",
        bairro: "",
        cidade: "",
        uf: "",
        dataAdmissao: "",
        dataDemissao: "",
        observacoes: "",
      },
    };
  }

  const { fields, parsed } = parseFuncionarioFormData(formData);

  if (!parsed.success) {
    const flattened = parsed.error.flatten().fieldErrors;
    const fieldErrors = Object.fromEntries(
      Object.entries(flattened).map(([key, value]) => [key, value?.[0]])
    ) as FuncionarioActionState["fieldErrors"];

    return {
      error: getFirstFieldError(flattened),
      fieldErrors,
      fields,
    };
  }

  if (fields.cpf) {
    const duplicateCpf = await prisma.funcionario.findFirst({
      where: {
        empresaId: user.empresaId,
        cpf: fields.cpf.replace(/\D/g, ""),
        id: { not: id },
      },
      select: { id: true },
    });

    if (duplicateCpf) {
      return {
        error: "Já existe outro funcionário com este CPF.",
        fieldErrors: { cpf: "Já existe outro funcionário com este CPF." },
        fields,
      };
    }
  }

  await prisma.funcionario.update({
    where: { id },
    data: {
      ...toFuncionarioDbInput(fields),
    },
  });

  revalidatePath("/funcionarios");
  revalidatePath(`/funcionarios/${id}`);
  revalidatePath(`/funcionarios/${id}/editar`);
  redirect("/funcionarios?ok=updated");
}

export async function toggleFuncionarioAtivo(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") || "").trim();

  if (!id) return;

  const funcionario = await prisma.funcionario.findFirst({
    where: {
      id,
      empresaId: user.empresaId,
    },
    select: {
      id: true,
      ativo: true,
    },
  });

  if (!funcionario) return;

  await prisma.funcionario.update({
    where: { id: funcionario.id },
    data: {
      ativo: !funcionario.ativo,
    },
  });

  revalidatePath("/funcionarios");
  revalidatePath(`/funcionarios/${funcionario.id}`);
  revalidatePath(`/funcionarios/${funcionario.id}/editar`);
}