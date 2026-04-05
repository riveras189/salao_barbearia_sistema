import { prisma } from "@/lib/prisma";

type Params = {
  empresaId: string;
  inicio?: string;
  fim?: string;
  profissionalId?: string;
  servicoId?: string;
};

function parseDateOnly(value?: string, endOfDay = false) {
  if (!value) return undefined;

  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return undefined;

  if (endOfDay) {
    return new Date(year, month - 1, day, 23, 59, 59, 999);
  }

  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

function getInicioPadrao() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
}

function getFimPadrao() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
}

export async function getRelatorioServicosProfissionais({
  empresaId,
  inicio,
  fim,
  profissionalId,
  servicoId,
}: Params) {
  const inicioDate = parseDateOnly(inicio) ?? getInicioPadrao();
  const fimDate = parseDateOnly(fim, true) ?? getFimPadrao();

  const where: any = {
    tipo: "SERVICO",
    comanda: {
      empresaId,
      status: "FECHADA",
      fechadaEm: {
        not: null,
        gte: inicioDate,
        lte: fimDate,
      },
    },
  };

  if (profissionalId && profissionalId !== "") {
    where.profissionalId = profissionalId;
  } else {
    where.profissionalId = { not: null };
  }

  if (servicoId && servicoId !== "") {
    where.servicoId = servicoId;
  }

  const itens = await prisma.comandaItem.findMany({
    where,
    include: {
      profissional: {
        select: {
          nome: true,
        },
      },
      comanda: {
        select: {
          fechadaEm: true,
        },
      },
    },
  });

  const agrupado: Record<
    string,
    {
      profissionalNome: string;
      servicoDescricao: string;
      quantidade: number;
      valorTotal: number;
    }
  > = {};

  let totalQuantidade = 0;
  let totalValor = 0;

  for (const item of itens) {
    const profissionalNome = item.profissional?.nome || "Desconhecido";
    const servicoDescricao = item.descricao || "Serviço";
    const chave = `${profissionalNome}__${servicoDescricao}`;

    if (!agrupado[chave]) {
      agrupado[chave] = {
        profissionalNome,
        servicoDescricao,
        quantidade: 0,
        valorTotal: 0,
      };
    }

    const quantidade = Number(item.quantidade) || 1;
    const valorTotal = Number(item.valorTotal) || 0;

    agrupado[chave].quantidade += quantidade;
    agrupado[chave].valorTotal += valorTotal;

    totalQuantidade += quantidade;
    totalValor += valorTotal;
  }

  const rows = Object.values(agrupado).sort((a, b) => {
    const prof = a.profissionalNome.localeCompare(b.profissionalNome, "pt-BR");
    if (prof !== 0) return prof;
    return a.servicoDescricao.localeCompare(b.servicoDescricao, "pt-BR");
  });

  return {
    inicioDate,
    fimDate,
    rows,
    totalQuantidade,
    totalValor,
  };
}