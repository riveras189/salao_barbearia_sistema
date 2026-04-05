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

function rangesOverlap(
  startA: Date,
  endA: Date,
  startB: Date,
  endB: Date
) {
  return startA < endB && startB < endA;
}

function splitWindow(
  data: string,
  horaInicio: string,
  horaFim: string,
  intervaloInicio?: string | null,
  intervaloFim?: string | null
) {
  const inicio = parseLocalDateTime(data, horaInicio);
  const fim = parseLocalDateTime(data, horaFim);

  if (!intervaloInicio || !intervaloFim) {
    return [{ inicio, fim }];
  }

  const pausaInicio = parseLocalDateTime(data, intervaloInicio);
  const pausaFim = parseLocalDateTime(data, intervaloFim);

  const partes: Array<{ inicio: Date; fim: Date }> = [];

  if (inicio < pausaInicio) {
    partes.push({ inicio, fim: pausaInicio });
  }

  if (pausaFim < fim) {
    partes.push({ inicio: pausaFim, fim });
  }

  return partes.filter((item) => item.inicio < item.fim);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const data = searchParams.get("data") || "";
    const profissionalId = searchParams.get("profissionalId") || "";
    const servicoIdsStr = searchParams.get("servicoIds") || "";

    const servicoIds = servicoIdsStr
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    if (!data || !profissionalId || servicoIds.length === 0) {
      return Response.json({
        horarios: [],
        debug: {
          etapa: "parametros",
          data,
          profissionalId,
          servicoIds,
          motivo: "faltam parâmetros",
        },
      });
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
      return Response.json({
        horarios: [],
        debug: {
          etapa: "empresa",
          motivo: "empresa não encontrada",
        },
      });
    }

    const profissional = await prisma.profissional.findFirst({
      where: {
        id: profissionalId,
        empresaId: empresa.id,
        ativo: true,
      },
      select: {
        id: true,
        nome: true,
      },
    });

    if (!profissional) {
      return Response.json({
        horarios: [],
        debug: {
          etapa: "profissional",
          motivo: "profissional não encontrado",
          profissionalId,
          empresaId: empresa.id,
        },
      });
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
        nome: true,
        duracaoMin: true,
      },
    });

    if (servicos.length !== servicoIds.length) {
      return Response.json({
        horarios: [],
        debug: {
          etapa: "servicos",
          motivo: "um ou mais serviços não foram encontrados/ativos/no site",
          servicoIdsRecebidos: servicoIds,
          servicosEncontrados: servicos.map((s) => ({
            id: s.id,
            nome: s.nome,
          })),
        },
      });
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
        return Response.json({
          horarios: [],
          debug: {
            etapa: "profissionalServico",
            motivo: "o profissional não atende um ou mais serviços",
            servicoIdsRecebidos: servicoIds,
            servicosPermitidos: relacoesProfissional.map((r) => r.servicoId),
          },
        });
      }
    }

    const duracaoTotal = servicoIds.reduce((acc, id) => {
      const servico = servicos.find((s) => s.id === id);
      const relacao = relacaoMap.get(id);
      return acc + (relacao?.duracaoMinOverride ?? servico?.duracaoMin ?? 0);
    }, 0);

    if (duracaoTotal <= 0) {
      return Response.json({
        horarios: [],
        debug: {
          etapa: "duracao",
          motivo: "duração total ficou zerada",
          servicoIds,
        },
      });
    }

    const dia = new Date(`${data}T00:00:00`);
    const diaSemanaJs = dia.getDay();
    const diaSemana1a7 = diaSemanaJs === 0 ? 7 : diaSemanaJs;

    const horariosProfissional = await prisma.profissionalHorario.findMany({
      where: {
        profissionalId,
        ativo: true,
        diaSemana: {
          in: [diaSemanaJs, diaSemana1a7],
        },
      },
      orderBy: [{ horaInicio: "asc" }],
    });

    if (horariosProfissional.length === 0) {
      return Response.json({
        horarios: [],
        debug: {
          etapa: "profissionalHorario",
          motivo: "nenhum horário cadastrado para esse dia da semana",
          data,
          diaSemanaJs,
          diaSemana1a7,
          profissionalId,
        },
      });
    }

    const inicioDia = parseLocalDateTime(data, "00:00");
    const fimDia = parseLocalDateTime(data, "23:59");
    const fimDiaExpandido = addMinutes(fimDia, 1);

    const [agendamentos, bloqueios] = await Promise.all([
      prisma.agendamento.findMany({
        where: {
          empresaId: empresa.id,
          profissionalId,
          status: {
            notIn: [StatusAgendamento.CANCELADO, StatusAgendamento.FALTOU],
          },
          AND: [
            { inicio: { lt: fimDiaExpandido } },
            { fim: { gt: inicioDia } },
          ],
        },
        select: {
          id: true,
          inicio: true,
          fim: true,
          status: true,
        },
        orderBy: { inicio: "asc" },
      }),
      prisma.bloqueioAgenda.findMany({
        where: {
          empresaId: empresa.id,
          profissionalId,
          ativo: true,
          AND: [
            { dataInicio: { lt: fimDiaExpandido } },
            { dataFim: { gt: inicioDia } },
          ],
        },
        select: {
          id: true,
          dataInicio: true,
          dataFim: true,
        },
        orderBy: { dataInicio: "asc" },
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
          const fimSlot = addMinutes(cursor, duracaoTotal);

          if (cursor < limiteMinimo) continue;
          if (cursor > limiteMaximo) continue;

          const conflitoAgendamento = agendamentos.some((item) =>
            rangesOverlap(cursor, fimSlot, item.inicio, item.fim)
          );

          if (conflitoAgendamento) continue;

          const conflitoBloqueio = bloqueios.some((item) =>
            rangesOverlap(cursor, fimSlot, item.dataInicio, item.dataFim)
          );

          if (conflitoBloqueio) continue;

          horarios.push(formatTime(cursor));
        }
      }
    }

    return Response.json({
      horarios: Array.from(new Set(horarios)).sort(),
      debug: {
        etapa: "final",
        data,
        profissionalId,
        servicoIds,
        profissional: profissional.nome,
        duracaoTotal,
        diaSemanaJs,
        diaSemana1a7,
        horariosProfissional: horariosProfissional.map((h) => ({
          diaSemana: h.diaSemana,
          horaInicio: h.horaInicio,
          horaFim: h.horaFim,
          intervaloInicio: h.intervaloInicio,
          intervaloFim: h.intervaloFim,
        })),
        agendamentosEncontrados: agendamentos.length,
        bloqueiosEncontrados: bloqueios.length,
        horariosGerados: Array.from(new Set(horarios)).sort(),
      },
    });
  } catch (error) {
    return Response.json({
      horarios: [],
      debug: {
        etapa: "catch",
        motivo: error instanceof Error ? error.message : "erro desconhecido",
      },
    });
  }
}