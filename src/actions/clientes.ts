"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import {
  getFirstFieldError,
  type ClienteActionState,
  parseClienteFormData,
  toClienteDbInput,
} from "@/schemas/cliente";

function normalizeFotoUrl(formData: FormData) {
  const value = String(formData.get("fotoUrl") ?? "").trim();
  return value || null;
}

export async function createClienteAction(
  _prevState: ClienteActionState,
  formData: FormData
): Promise<ClienteActionState> {
  const user = await requireUser();

  const fotoUrl = normalizeFotoUrl(formData);
  const { fields, parsed } = parseClienteFormData(formData);

  if (!parsed.success) {
    const flattened = parsed.error.flatten().fieldErrors;
    const fieldErrors = Object.fromEntries(
      Object.entries(flattened).map(([key, value]) => [key, value?.[0]])
    ) as ClienteActionState["fieldErrors"];

    return {
      error: getFirstFieldError(flattened),
      fieldErrors,
      fields,
    };
  }

  if (fields.cpf) {
    const duplicate = await prisma.cliente.findFirst({
      where: {
        empresaId: user.empresaId,
        cpf: fields.cpf,
      },
      select: { id: true },
    });

    if (duplicate) {
      return {
        error: "Já existe um cliente com este CPF.",
        fieldErrors: { cpf: "Já existe um cliente com este CPF." },
        fields,
      };
    }
  }

  await prisma.cliente.create({
    data: {
      empresaId: user.empresaId,
      ...toClienteDbInput(fields),
      fotoUrl,
      ativo: true,
    },
  });

  revalidatePath("/clientes");
  revalidatePath("/agenda");

  redirect("/clientes?ok=created");
}

export async function updateClienteAction(
  _prevState: ClienteActionState,
  formData: FormData
): Promise<ClienteActionState> {
  const user = await requireUser();

  const id = String(formData.get("id") || "").trim();
  if (!id) {
    return {
      error: "Cliente inválido.",
    };
  }

  const existing = await prisma.cliente.findFirst({
    where: {
      id,
      empresaId: user.empresaId,
    },
    select: { id: true },
  });

  if (!existing) {
    return {
      error: "Cliente não encontrado.",
    };
  }

  const fotoUrl = normalizeFotoUrl(formData);
  const { fields, parsed } = parseClienteFormData(formData);

  if (!parsed.success) {
    const flattened = parsed.error.flatten().fieldErrors;
    const fieldErrors = Object.fromEntries(
      Object.entries(flattened).map(([key, value]) => [key, value?.[0]])
    ) as ClienteActionState["fieldErrors"];

    return {
      error: getFirstFieldError(flattened),
      fieldErrors,
      fields,
    };
  }

  if (fields.cpf) {
    const duplicate = await prisma.cliente.findFirst({
      where: {
        empresaId: user.empresaId,
        cpf: fields.cpf,
        id: { not: id },
      },
      select: { id: true },
    });

    if (duplicate) {
      return {
        error: "Já existe outro cliente com este CPF.",
        fieldErrors: { cpf: "Já existe outro cliente com este CPF." },
        fields,
      };
    }
  }

  await prisma.cliente.update({
    where: { id },
    data: {
      ...toClienteDbInput(fields),
      fotoUrl,
    },
  });

  revalidatePath("/clientes");
  revalidatePath(`/clientes/${id}`);
  revalidatePath(`/clientes/${id}/editar`);
  revalidatePath("/agenda");

  redirect("/clientes?ok=updated");
}

export async function toggleClienteAtivo(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") || "").trim();

  if (!id) return;

  const cliente = await prisma.cliente.findFirst({
    where: {
      id,
      empresaId: user.empresaId,
    },
    select: {
      id: true,
      ativo: true,
    },
  });

  if (!cliente) return;

  await prisma.cliente.update({
    where: { id: cliente.id },
    data: {
      ativo: !cliente.ativo,
    },
  });

  revalidatePath("/clientes");
  revalidatePath(`/clientes/${cliente.id}`);
  revalidatePath(`/clientes/${cliente.id}/editar`);
  revalidatePath("/agenda");
}