"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import {
  getFirstFieldError,
  type ServicoActionState,
  parseServicoFormData,
  toServicoDbInput,
} from "@/schemas/servico";

async function resolveCategoriaId(empresaId: string, categoriaNome: string) {
  const nome = String(categoriaNome || "").trim();
  if (!nome) return null;

  const categoria = await prisma.servicoCategoria.upsert({
    where: {
      empresaId_nome: {
        empresaId,
        nome,
      },
    },
    update: {},
    create: {
      empresaId,
      nome,
      ativo: true,
      ordemExibicao: 0,
    },
    select: {
      id: true,
    },
  });

  return categoria.id;
}

async function syncProfissionaisServico(
  empresaId: string,
  servicoId: string,
  profissionalIds: string[]
) {
  const validProfissionais = await prisma.profissional.findMany({
    where: {
      empresaId,
      id: { in: profissionalIds },
    },
    select: {
      id: true,
    },
  });

  const validIds = validProfissionais.map((item) => item.id);

  await prisma.profissionalServico.deleteMany({
    where: { servicoId },
  });

  if (validIds.length) {
    await prisma.profissionalServico.createMany({
      data: validIds.map((profissionalId) => ({
        profissionalId,
        servicoId,
        ativo: true,
      })),
    });
  }
}

export async function createServicoAction(
  _prevState: ServicoActionState,
  formData: FormData
): Promise<ServicoActionState> {
  const user = await requireUser();
  const { fields, parsed } = parseServicoFormData(formData);

  if (!parsed.success) {
    const flattened = parsed.error.flatten().fieldErrors;
    const fieldErrors = Object.fromEntries(
      Object.entries(flattened).map(([key, value]) => [key, value?.[0]])
    ) as ServicoActionState["fieldErrors"];

    return {
      error: getFirstFieldError(flattened),
      fieldErrors,
      fields,
    };
  }

  const duplicate = await prisma.servico.findFirst({
    where: {
      empresaId: user.empresaId,
      nome: fields.nome,
    },
    select: { id: true },
  });

  if (duplicate) {
    return {
      error: "Já existe um serviço com este nome.",
      fieldErrors: { nome: "Já existe um serviço com este nome." },
      fields,
    };
  }

  const categoriaId = await resolveCategoriaId(user.empresaId, fields.categoriaNome);

  const servico = await prisma.servico.create({
    data: {
      empresaId: user.empresaId,
      categoriaId,
      ativo: true,
      ...toServicoDbInput(fields),
    },
    select: {
      id: true,
    },
  });

  await syncProfissionaisServico(user.empresaId, servico.id, fields.profissionalIds);

  revalidatePath("/servicos");
  revalidatePath("/profissionais");
  redirect("/servicos?ok=created");
}

export async function updateServicoAction(
  _prevState: ServicoActionState,
  formData: FormData
): Promise<ServicoActionState> {
  const user = await requireUser();
  const id = String(formData.get("id") || "").trim();

  if (!id) {
    return { error: "Serviço inválido." };
  }

  const existing = await prisma.servico.findFirst({
    where: {
      id,
      empresaId: user.empresaId,
    },
    select: { id: true },
  });

  if (!existing) {
    return { error: "Serviço não encontrado." };
  }

  const { fields, parsed } = parseServicoFormData(formData);

  if (!parsed.success) {
    const flattened = parsed.error.flatten().fieldErrors;
    const fieldErrors = Object.fromEntries(
      Object.entries(flattened).map(([key, value]) => [key, value?.[0]])
    ) as ServicoActionState["fieldErrors"];

    return {
      error: getFirstFieldError(flattened),
      fieldErrors,
      fields,
    };
  }

  const duplicate = await prisma.servico.findFirst({
    where: {
      empresaId: user.empresaId,
      nome: fields.nome,
      id: { not: id },
    },
    select: { id: true },
  });

  if (duplicate) {
    return {
      error: "Já existe outro serviço com este nome.",
      fieldErrors: { nome: "Já existe outro serviço com este nome." },
      fields,
    };
  }

  const categoriaId = await resolveCategoriaId(user.empresaId, fields.categoriaNome);

  await prisma.servico.update({
    where: { id },
    data: {
      categoriaId,
      ...toServicoDbInput(fields),
    },
  });

  await syncProfissionaisServico(user.empresaId, id, fields.profissionalIds);

  revalidatePath("/servicos");
  revalidatePath(`/servicos/${id}`);
  revalidatePath(`/servicos/${id}/editar`);
  revalidatePath("/profissionais");
  redirect("/servicos?ok=updated");
}

export async function toggleServicoAtivo(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") || "").trim();

  if (!id) return;

  const servico = await prisma.servico.findFirst({
    where: {
      id,
      empresaId: user.empresaId,
    },
    select: {
      id: true,
      ativo: true,
    },
  });

  if (!servico) return;

  await prisma.servico.update({
    where: { id: servico.id },
    data: {
      ativo: !servico.ativo,
    },
  });

  revalidatePath("/servicos");
  revalidatePath(`/servicos/${servico.id}`);
  revalidatePath(`/servicos/${servico.id}/editar`);
}