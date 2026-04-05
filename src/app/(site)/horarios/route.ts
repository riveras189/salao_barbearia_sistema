import { StatusAgendamento } from "@prisma/client";
import { prisma } from "@/lib/prisma";

function parseLocalDateTime(data: string, hora: string) {
  const [y, m, d] = data.split("-").map(Number);
  const [hh, mm] = hora.split(":").map(Number);
  return new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, 0, 0);
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60000);
}

function formatTime(date: Date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes()
  ).padStart(2, "0")}`;
}

function splitWindow(
  data: string,
  horaInicio: string,
  horaFim: string,
  intervaloInicio?: string | null,
  intervaloFim?: string | null
) {
  const ini = parseLocalDateTime(data, horaInicio);
  const fim = parseLocalDateTime(data, horaFim);

  if (!intervaloInicio || !intervaloFim) {
    return [{ inicio: ini, fim }];
  }

  const intIni = parseLocalDateTime(data, intervaloInicio);
  const intFim = parseLocalDateTime(data, intervaloFim);

  const partes: Array<{ inicio: Date; fim: Date }> = [];

  if (ini < intIni) {
    partes.push({ inicio: ini, fim: intIni });
  }

  if (intFim < fim) {
    partes.push({ inicio: intFim, fim });
  }

  return partes.filter((item) => item.inicio < item.fim);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const data = searchParams.get("data") || "";
  const profissionalId = searchParams.get("profissionalId") || "";
  const servicoIdsStr = searchParams.get("servicoIds") || "";

  const servicoIds = servicoIdsStr
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (!data || !profissionalId || servicoIds.length === 0) {
    return Response.json({ horarios: [] });
  }

  const empresa = await prisma.empresa.findFirst({
    where: { ativo: true },
    orderBy: { createdAt: "asc" },
    include: {
      configuracao: true,
      agendamentoOnlineConfig: true,
    },
  });

  if (!empresa) {
    return Response.json({ horarios: [] });
  }

  const profissional = await prisma.profissional.findFirst({
    where: {
      id: profissionalId,
      empresaId: empresa.id,
      ativo: true,
    },
    select: { id: true },
  });

  if (!profissional) {
    return Response.json({ horarios: [] });
  }

  const servicos = await prisma.servico.findMany({
    where: {
      id: { in: servicoIds },
      empresaId: empresa.id,
      ativo: true,
      exibirNoSite: true,
    },
    select: {
      id: true,
      duracaoMin: true,
    },
  });

  if (servicos.length !== servicoIds.length) {
    return Response.json({ horarios: [] });
  }

  const relacoesProfissional = await prisma.profissionalServico.findMany({
    where: {
      profissionalId,
      ativo: true,
    },
    select: {
      servicoId: true,
      duracaoMinOverride: true,
    },
  });

  const profissionalTemServicosConfigurados = relacoesProfissional.length > 0;
  const relacaoMap = new Map(relacoesProfissional.map((r) => [r.servicoId, r]));

  if (profissionalTemServicosConfigurados) {
    const invalido = servicoIds.some((id) => !relacaoMap.has(id));
    if (invalido) {
      return Response.json({ horarios: [] });
    }
  }

  const duracaoTotal = servicoIds.reduce((acc, id) => {
    const servico = servicos.find((s) => s.id === id);
    const relacao = relacaoMap.get(id);
    return acc + (relacao?.duracaoMinOverride ?? servico?.duracaoMin ?? 0);
  }, 0);

  if (duracaoTotal <= 0) {
    return Response.json({ horarios: [] });
  }

  const dia = new Date(`${data}T00:00:00`);
  const diaSemanaJs = dia.getDay();
  const diaSemanaAlternativo = diaSemanaJs === 0 ? 7 : diaSemanaJs;

  const horariosProfissional = await prisma.profissionalHorario.findMany({
    where: {
      profissionalId,
      ativo: true,
      diaSemana: {
        in: [diaSemanaJs, diaSemanaAlternativo],
      },
    },
    orderBy: [{ horaInicio: "asc" }],
  });

  if (horariosProfissional.length === 0) {
    return Response.json({ horarios: [] });
  }

  const inicioDia = parseLocalDateTime(data, "00:00");
  const fimDia = parseLocalDateTime(data, "23:59");

  const [agendamentos, bloqueios] = await Promise.all([
    prisma.agendamento.findMany({
      where: {
        empresaId: empresa.id,
        profissionalId,
        status: {
          notIn: [StatusAgendamento.CANCELADO, StatusAgendamento.FALTOU],
        },
        inicio: {
          gte: inicioDia,
          lte: fimDia,
        },
      },
      select: {
        inicio: true,
        fim: true,
      },
    }),
    prisma.bloqueioAgenda.findMany({
      where: {
        empresaId: empresa.id,
        profissionalId,
        ativo: true,
        dataInicio: { lte: fimDia },
        dataFim: { gte: inicioDia },
      },
      select: {
        dataInicio: true,
        dataFim: true,
      },
    }),
  ]);

  const agora = new Date();
  const antecedenciaMinHoras =
    empresa.agendamentoOnlineConfig?.antecedenciaMinHoras ?? 2;
  const antecedenciaMaxDias =
    empresa.agendamentoOnlineConfig?.antecedenciaMaxDias ?? 30;
  const passoMin = empresa.configuracao?.intervaloAgendaMin ?? 15;

  const limiteMinimo = addMinutes(agora, antecedenciaMinHoras * 60);
  const limiteMaximo = addMinutes(agora, antecedenciaMaxDias * 24 * 60);

  const horarios: string[] = [];

  for (const horario of horariosProfissional) {
    const janelas = splitWindow(
      data,
      horario.horaInicio,
      horario.horaFim,
      horario.intervaloInicio,
      horario.intervaloFim
    );

    for (const janela of janelas) {
      for (
        let cursor = new Date(janela.inicio);
        cursor <= addMinutes(janela.fim, -duracaoTotal);
        cursor = addMinutes(cursor, passoMin)
      ) {
        const fim = addMinutes(cursor, duracaoTotal);

        if (cursor < limiteMinimo) continue;
        if (cursor > limiteMaximo) continue;

        const conflitoAgendamento = agendamentos.some(
          (item) => cursor < item.fim && item.inicio < fim
        );

        if (conflitoAgendamento) continue;

        const conflitoBloqueio = bloqueios.some(
          (item) => cursor < item.dataFim && item.dataInicio < fim
        );

        if (conflitoBloqueio) continue;

        horarios.push(formatTime(cursor));
      }
    }
  }

  const unicos = Array.from(new Set(horarios)).sort();

  return Response.json({ horarios: unicos });
}