"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import {
  diasSemana,
  getFirstFieldError,
  type ProfissionalActionState,
  parseProfissionalFormData,
  toProfissionalDbInput,
} from "@/schemas/profissional";

export async function createProfissionalAction(
  _prevState: ProfissionalActionState,
  formData: FormData
): Promise<ProfissionalActionState> {
  const user = await requireUser();
  const { fields, parsed } = parseProfissionalFormData(formData);

  if (!parsed.success) {
    const flattened = parsed.error.flatten().fieldErrors;
    const fieldErrors = Object.fromEntries(
      Object.entries(flattened).map(([key, value]) => [key, value?.[0]])
    ) as ProfissionalActionState["fieldErrors"];

    return {
      error: getFirstFieldError(flattened),
      fieldErrors,
      fields,
    };
  }

  if (fields.cpf) {
    const duplicateCpf = await prisma.profissional.findFirst({
      where: {
        empresaId: user.empresaId,
        cpf: fields.cpf,
      },
      select: { id: true },
    });

    if (duplicateCpf) {
      return {
        error: "Já existe um profissional com este CPF.",
        fieldErrors: { cpf: "Já existe um profissional com este CPF." },
        fields,
      };
    }
  }

  if (fields.cnpj) {
    const duplicateCnpj = await prisma.profissional.findFirst({
      where: {
        empresaId: user.empresaId,
        cnpj: fields.cnpj,
      },
      select: { id: true },
    });

    if (duplicateCnpj) {
      return {
        error: "Já existe um profissional com este CNPJ.",
        fieldErrors: { cnpj: "Já existe um profissional com este CNPJ." },
        fields,
      };
    }
  }

  await prisma.profissional.create({
    data: {
      empresaId: user.empresaId,
      ...toProfissionalDbInput(fields),
      ativo: true,
    },
  });

  revalidatePath("/profissionais");
  redirect("/profissionais?ok=created");
}

export async function updateProfissionalAction(
  _prevState: ProfissionalActionState,
  formData: FormData
): Promise<ProfissionalActionState> {
  const user = await requireUser();
  const id = String(formData.get("id") || "").trim();

  if (!id) {
    return { error: "Profissional inválido." };
  }

  const existing = await prisma.profissional.findFirst({
    where: {
      id,
      empresaId: user.empresaId,
    },
    select: { id: true },
  });

  if (!existing) {
    return { error: "Profissional não encontrado." };
  }

  const { fields, parsed } = parseProfissionalFormData(formData);

  if (!parsed.success) {
    const flattened = parsed.error.flatten().fieldErrors;
    const fieldErrors = Object.fromEntries(
      Object.entries(flattened).map(([key, value]) => [key, value?.[0]])
    ) as ProfissionalActionState["fieldErrors"];

    return {
      error: getFirstFieldError(flattened),
      fieldErrors,
      fields,
    };
  }

  if (fields.cpf) {
    const duplicateCpf = await prisma.profissional.findFirst({
      where: {
        empresaId: user.empresaId,
        cpf: fields.cpf,
        id: { not: id },
      },
      select: { id: true },
    });

    if (duplicateCpf) {
      return {
        error: "Já existe outro profissional com este CPF.",
        fieldErrors: { cpf: "Já existe outro profissional com este CPF." },
        fields,
      };
    }
  }

  if (fields.cnpj) {
    const duplicateCnpj = await prisma.profissional.findFirst({
      where: {
        empresaId: user.empresaId,
        cnpj: fields.cnpj,
        id: { not: id },
      },
      select: { id: true },
    });

    if (duplicateCnpj) {
      return {
        error: "Já existe outro profissional com este CNPJ.",
        fieldErrors: { cnpj: "Já existe outro profissional com este CNPJ." },
        fields,
      };
    }
  }

  await prisma.profissional.update({
    where: { id },
    data: {
      ...toProfissionalDbInput(fields),
    },
  });

  revalidatePath("/profissionais");
  revalidatePath(`/profissionais/${id}`);
  revalidatePath(`/profissionais/${id}/editar`);
  redirect("/profissionais?ok=updated");
}

export async function toggleProfissionalAtivo(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") || "").trim();

  if (!id) return;

  const profissional = await prisma.profissional.findFirst({
    where: {
      id,
      empresaId: user.empresaId,
    },
    select: {
      id: true,
      ativo: true,
    },
  });

  if (!profissional) return;

  await prisma.profissional.update({
    where: { id: profissional.id },
    data: {
      ativo: !profissional.ativo,
    },
  });

  revalidatePath("/profissionais");
  revalidatePath(`/profissionais/${profissional.id}`);
  revalidatePath(`/profissionais/${profissional.id}/editar`);
}

export async function saveProfissionalHorariosAction(formData: FormData) {
  const user = await requireUser();
  const profissionalId = String(formData.get("profissionalId") || "").trim();

  if (!profissionalId) return;

  const profissional = await prisma.profissional.findFirst({
    where: {
      id: profissionalId,
      empresaId: user.empresaId,
    },
    select: { id: true },
  });

  if (!profissional) return;

  const data = diasSemana
    .map((dia) => {
      const ativo = String(formData.get(`dia_${dia.value}_ativo`) || "") === "1";
      const horaInicio = String(formData.get(`dia_${dia.value}_horaInicio`) || "").trim();
      const horaFim = String(formData.get(`dia_${dia.value}_horaFim`) || "").trim();
      const intervaloInicio = String(
        formData.get(`dia_${dia.value}_intervaloInicio`) || ""
      ).trim();
      const intervaloFim = String(
        formData.get(`dia_${dia.value}_intervaloFim`) || ""
      ).trim();

      if (!ativo || !horaInicio || !horaFim) return null;

      return {
        profissionalId,
        diaSemana: dia.value,
        horaInicio,
        horaFim,
        intervaloInicio: intervaloInicio || null,
        intervaloFim: intervaloFim || null,
        ativo: true,
      };
    })
    .filter(Boolean) as {
      profissionalId: string;
      diaSemana: number;
      horaInicio: string;
      horaFim: string;
      intervaloInicio: string | null;
      intervaloFim: string | null;
      ativo: boolean;
    }[];

  await prisma.profissionalHorario.deleteMany({
    where: { profissionalId },
  });

  if (data.length) {
    await prisma.profissionalHorario.createMany({
      data,
    });
  }

  revalidatePath(`/profissionais/${profissionalId}`);
  revalidatePath(`/profissionais/${profissionalId}/horarios`);
  redirect(`/profissionais/${profissionalId}/horarios?ok=1`);
}

export async function saveProfissionalServicosAction(formData: FormData) {
  const user = await requireUser();
  const profissionalId = String(formData.get("profissionalId") || "").trim();

  if (!profissionalId) return;

  const profissional = await prisma.profissional.findFirst({
    where: {
      id: profissionalId,
      empresaId: user.empresaId,
    },
    select: { id: true },
  });

  if (!profissional) return;

  const rawIds = formData.getAll("servicoIds");
  const servicoIds = Array.from(
    new Set(rawIds.map((item) => String(item)).filter(Boolean))
  );

  const validServicos = await prisma.servico.findMany({
    where: {
      empresaId: user.empresaId,
      id: { in: servicoIds },
    },
    select: { id: true },
  });

  const validIds = validServicos.map((s) => s.id);

  await prisma.profissionalServico.deleteMany({
    where: { profissionalId },
  });

  if (validIds.length) {
    await prisma.profissionalServico.createMany({
      data: validIds.map((servicoId) => ({
        profissionalId,
        servicoId,
        ativo: true,
      })),
    });
  }

  revalidatePath(`/profissionais/${profissionalId}`);
  revalidatePath(`/profissionais/${profissionalId}/servicos`);
  redirect(`/profissionais/${profissionalId}/servicos?ok=1`);
}