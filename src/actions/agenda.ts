"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  OrigemAgendamento,
  StatusAgendamento,
  TipoBloqueioAgenda,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import {
  addMinutes,
  combineDateTime,
  formatTime,
  isWithinSchedule,
  overlaps,
  ymdFromDate,
} from "@/lib/agenda";
import {
  getFirstAgendamentoError,
  getFirstBloqueioError,
  type AgendamentoActionState,
  type BloqueioActionState,
  parseAgendamentoFormData,
  parseBloqueioFormData,
} from "@/schemas/agendamento";

async function getServicoSnapshots(
  empresaId: string,
  profissionalId: string,
  servicoIds: string[]
) {
  const servicos = await prisma.servico.findMany({
    where: {
      empresaId,
      id: { in: servicoIds },
      ativo: true,
    },
    select: {
      id: true,
      nome: true,
      preco: true,
      duracaoMin: true,
      comissaoPercentualPadrao: true,
    },
  });

  const overrides = await prisma.profissionalServico.findMany({
    where: {
      profissionalId,
      servicoId: { in: servicoIds },
      ativo: true,
    },
    select: {
      servicoId: true,
      valorOverride: true,
      duracaoMinOverride: true,
      comissaoPercentualOverride: true,
    },
  });

  const overrideMap = new Map(overrides.map((item) => [item.servicoId, item]));

  const ordered = servicoIds
    .map((id) => servicos.find((item) => item.id === id))
    .filter(Boolean) as typeof servicos;

  const snapshots = ordered.map((servico) => {
    const ov = overrideMap.get(servico.id);

    return {
      servicoId: servico.id,
      nomeSnapshot: servico.nome,
      duracaoMinSnapshot: ov?.duracaoMinOverride ?? servico.duracaoMin,
      valorSnapshot: ov?.valorOverride ?? servico.preco,
      comissaoPercentualSnapshot:
        ov?.comissaoPercentualOverride ?? servico.comissaoPercentualPadrao,
    };
  });

  return snapshots;
}

async function validateAgendamentoDisponibilidade(args: {
  empresaId: string;
  profissionalId: string;
  dateYmd: string;
  inicio: Date;
  fim: Date;
  encaixe: boolean;
  excludeId?: string;
}) {
  const { empresaId, profissionalId, dateYmd, inicio, fim, encaixe, excludeId } = args;

  const profissional = await prisma.profissional.findFirst({
    where: {
      id: profissionalId,
      empresaId,
    },
    include: {
      horarios: true,
    },
  });

  if (!profissional) {
    throw new Error("Profissional não encontrado.");
  }

  const dataDemissao = profissional.dataDemissao
    ? ymdFromDate(profissional.dataDemissao)
    : null;

  if (!profissional.ativo && dataDemissao && dataDemissao <= dateYmd) {
    throw new Error("Este profissional está desligado para esta data.");
  }

  if (!encaixe) {
    const withinSchedule = isWithinSchedule(
      inicio,
      fim,
      dateYmd,
      profissional.horarios.map((item) => ({
        diaSemana: item.diaSemana,
        horaInicio: item.horaInicio,
        horaFim: item.horaFim,
        intervaloInicio: item.intervaloInicio,
        intervaloFim: item.intervaloFim,
        ativo: item.ativo,
      }))
    );

    if (!withinSchedule) {
      throw new Error("O horário está fora da escala do profissional.");
    }
  }

  const agendamentos = await prisma.agendamento.findMany({
    where: {
      empresaId,
      profissionalId,
      id: excludeId ? { not: excludeId } : undefined,
      status: {
        in: [
          StatusAgendamento.AGENDADO,
          StatusAgendamento.CONFIRMADO,
          StatusAgendamento.EM_ATENDIMENTO,
        ],
      },
      inicio: { lt: fim },
      fim: { gt: inicio },
    },
    select: {
      id: true,
      inicio: true,
      fim: true,
    },
  });

  if (!encaixe && agendamentos.length) {
    throw new Error("Já existe agendamento neste horário para este profissional.");
  }

  const bloqueios = await prisma.bloqueioAgenda.findMany({
    where: {
      empresaId,
      profissionalId,
      ativo: true,
      dataInicio: { lt: fim },
      dataFim: { gt: inicio },
    },
    select: {
      id: true,
      dataInicio: true,
      dataFim: true,
    },
  });

  if (!encaixe && bloqueios.length) {
    throw new Error("Existe um bloqueio de agenda neste horário.");
  }
}


function mapAgendamentoFieldErrors(
  flattened: Record<string, string[] | undefined>
): AgendamentoActionState["fieldErrors"] {
  return Object.fromEntries(
    Object.entries(flattened).map(([key, value]) => [key, value?.[0]])
  ) as AgendamentoActionState["fieldErrors"];
}

function mapBloqueioFieldErrors(
  flattened: Record<string, string[] | undefined>
): BloqueioActionState["fieldErrors"] {
  return Object.fromEntries(
    Object.entries(flattened).map(([key, value]) => [key, value?.[0]])
  ) as BloqueioActionState["fieldErrors"];
}

export async function createAgendamentoAction(
  _prevState: AgendamentoActionState,
  formData: FormData
): Promise<AgendamentoActionState> {
  const user = await requireUser();
  const { fields, parsed } = parseAgendamentoFormData(formData);

  if (!parsed.success) {
    const flattened = parsed.error.flatten().fieldErrors;
    return {
      error: getFirstAgendamentoError(flattened),
      fieldErrors: mapAgendamentoFieldErrors(flattened),
      fields,
    };
  }

  try {
    const snapshots = await getServicoSnapshots(
      user.empresaId,
      fields.profissionalId,
      fields.servicoIds
    );

    if (!snapshots.length) {
      return {
        error: "Selecione pelo menos um serviço válido.",
        fields,
      };
    }

    const duracaoTotal = snapshots.reduce(
      (acc, item) => acc + Number(item.duracaoMinSnapshot || 0),
      0
    );

    const inicio = combineDateTime(fields.data, fields.horaInicio);
    const fim = addMinutes(inicio, duracaoTotal);

    await validateAgendamentoDisponibilidade({
      empresaId: user.empresaId,
      profissionalId: fields.profissionalId,
      dateYmd: fields.data,
      inicio,
      fim,
      encaixe: fields.encaixe,
    });

    await prisma.agendamento.create({
      data: {
        empresaId: user.empresaId,
        clienteId: fields.clienteId,
        profissionalId: fields.profissionalId,
        inicio,
        fim,
        status: StatusAgendamento.AGENDADO,
        origem: OrigemAgendamento.INTERNO,
        observacoes: fields.observacoes || null,
        encaixe: fields.encaixe,
        criadoPorUsuarioId: user.id,
        servicos: {
          create: snapshots.map((item, index) => ({
            servicoId: item.servicoId,
            nomeSnapshot: item.nomeSnapshot,
            duracaoMinSnapshot: Number(item.duracaoMinSnapshot),
            valorSnapshot: item.valorSnapshot,
            comissaoPercentualSnapshot: item.comissaoPercentualSnapshot,
            ordem: index,
          })),
        },
      },
    });
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Não foi possível salvar o agendamento.",
      fields,
    };
  }

  revalidatePath("/agenda");
  redirect(`/agenda?dia=${fields.data}&ok=created`);
}


export async function updateAgendamentoAction(
  _prevState: AgendamentoActionState,
  formData: FormData
): Promise<AgendamentoActionState> {
  const user = await requireUser();
  const id = String(formData.get("id") || "").trim();
  const { fields, parsed } = parseAgendamentoFormData(formData);

  if (!id) {
    return { error: "Agendamento inválido." };
  }

  if (!parsed.success) {
    const flattened = parsed.error.flatten().fieldErrors;
    return {
      error: getFirstAgendamentoError(flattened),
      fieldErrors: mapAgendamentoFieldErrors(flattened),
      fields,
    };
  }

  try {
    const existing = await prisma.agendamento.findFirst({
      where: {
        id,
        empresaId: user.empresaId,
      },
      select: { id: true },
    });

    if (!existing) {
      return { error: "Agendamento não encontrado.", fields };
    }

    const snapshots = await getServicoSnapshots(
      user.empresaId,
      fields.profissionalId,
      fields.servicoIds
    );

    if (!snapshots.length) {
      return {
        error: "Selecione pelo menos um serviço válido.",
        fields,
      };
    }

    const duracaoTotal = snapshots.reduce(
      (acc, item) => acc + Number(item.duracaoMinSnapshot || 0),
      0
    );

    const inicio = combineDateTime(fields.data, fields.horaInicio);
    const fim = addMinutes(inicio, duracaoTotal);

    await validateAgendamentoDisponibilidade({
      empresaId: user.empresaId,
      profissionalId: fields.profissionalId,
      dateYmd: fields.data,
      inicio,
      fim,
      encaixe: fields.encaixe,
      excludeId: id,
    });

    await prisma.agendamento.update({
      where: { id },
      data: {
        clienteId: fields.clienteId,
        profissionalId: fields.profissionalId,
        inicio,
        fim,
        observacoes: fields.observacoes || null,
        encaixe: fields.encaixe,
        servicos: {
          deleteMany: {},
          create: snapshots.map((item, index) => ({
            servicoId: item.servicoId,
            nomeSnapshot: item.nomeSnapshot,
            duracaoMinSnapshot: Number(item.duracaoMinSnapshot),
            valorSnapshot: item.valorSnapshot,
            comissaoPercentualSnapshot: item.comissaoPercentualSnapshot,
            ordem: index,
          })),
        },
      },
    });
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar o agendamento.",
      fields,
    };
  }

  revalidatePath("/agenda");
  revalidatePath(`/agenda/${id}/editar`);
  redirect(`/agenda?dia=${fields.data}&ok=updated`);
}

export async function setAgendamentoStatusAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") || "").trim();
  const status = String(formData.get("status") || "").trim() as StatusAgendamento;
  const dia = String(formData.get("dia") || "").trim();

  if (!id || !status) return;

  await prisma.agendamento.updateMany({
    where: {
      id,
      empresaId: user.empresaId,
    },
    data: {
      status,
    },
  });

  revalidatePath("/agenda");
  revalidatePath(`/agenda/${id}/editar`);
  redirect(`/agenda?dia=${dia || ""}`);
}

export async function createBloqueioAgendaAction(
  _prevState: BloqueioActionState,
  formData: FormData
): Promise<BloqueioActionState> {
  const user = await requireUser();
  const { fields, parsed } = parseBloqueioFormData(formData);

  if (!parsed.success) {
    const flattened = parsed.error.flatten().fieldErrors;
    return {
      error: getFirstBloqueioError(flattened),
      fieldErrors: mapBloqueioFieldErrors(flattened),
      fields,
    };
  }

  if (fields.horaFim <= fields.horaInicio) {
    return {
      error: "A hora final deve ser maior que a hora inicial.",
      fields,
    };
  }

  const dataInicio = combineDateTime(fields.data, fields.horaInicio);
  const dataFim = combineDateTime(fields.data, fields.horaFim);

  await prisma.bloqueioAgenda.create({
    data: {
      empresaId: user.empresaId,
      profissionalId: fields.profissionalId,
      dataInicio,
      dataFim,
      tipo: fields.tipo || TipoBloqueioAgenda.OUTRO,
      descricao: fields.descricao || null,
      cor: fields.cor || "#fecaca",
      recorrente: fields.recorrente,
      ativo: true,
    },
  });

  revalidatePath("/agenda");
  redirect(`/agenda?dia=${fields.data}&ok=blocked`);
}

export async function updateBloqueioAgendaAction(
  _prevState: BloqueioActionState,
  formData: FormData
): Promise<BloqueioActionState> {
  const user = await requireUser();
  const id = String(formData.get("id") || "").trim();
  const { fields, parsed } = parseBloqueioFormData(formData);

  if (!id) {
    return { error: "Bloqueio inválido." };
  }

  if (!parsed.success) {
    const flattened = parsed.error.flatten().fieldErrors;
    return {
      error: getFirstBloqueioError(flattened),
      fieldErrors: mapBloqueioFieldErrors(flattened),
      fields,
    };
  }

  if (fields.horaFim <= fields.horaInicio) {
    return {
      error: "A hora final deve ser maior que a hora inicial.",
      fields,
    };
  }

  const dataInicio = combineDateTime(fields.data, fields.horaInicio);
  const dataFim = combineDateTime(fields.data, fields.horaFim);

  await prisma.bloqueioAgenda.updateMany({
    where: {
      id,
      empresaId: user.empresaId,
    },
    data: {
      profissionalId: fields.profissionalId,
      dataInicio,
      dataFim,
      tipo: fields.tipo,
      descricao: fields.descricao || null,
      cor: fields.cor,
      recorrente: fields.recorrente,
    },
  });

  revalidatePath("/agenda");
  revalidatePath(`/agenda/bloqueios/${id}/editar`);
  redirect(`/agenda?dia=${fields.data}&ok=blocked_updated`);
}

export async function deleteBloqueioAgendaAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") || "").trim();
  const dia = String(formData.get("dia") || "").trim();

  if (!id) return;

  await prisma.bloqueioAgenda.deleteMany({
    where: {
      id,
      empresaId: user.empresaId,
    },
  });

  revalidatePath("/agenda");
  redirect(`/agenda?dia=${dia || ""}`);
}