import { prisma } from "@/lib/prisma";
import { formatMoneyBR, buildCreatedAtWhere } from "./helpers";
import type { ReportCompany, ReportData, ReportFilters } from "./types";

function toDateValue(value: any) {
  if (!value) return 0;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? 0 : d.getTime();
}

function formatDateTimeBR(value: any) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(d);
}

export async function buildVendasReport(
  filters: ReportFilters,
  company: ReportCompany,
  empresaId?: string
): Promise<ReportData> {
  const q = String(filters.q ?? "").trim();
  const qLower = q.toLowerCase();
  const dateWhere = buildCreatedAtWhere(filters);

  const where: any = {
    ...(empresaId ? { empresaId } : {}),
  };

  if (dateWhere) {
    where.fechadaEm = dateWhere;
  }

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.clienteId) {
    where.clienteId = filters.clienteId;
  }

  if (filters.profissionalId) {
    where.profissionalPrincipalId = filters.profissionalId;
  }

  const comandas = await prisma.comanda.findMany({
    where,
    include: {
      cliente: { select: { nome: true } },
      profissionalPrincipal: { select: { nome: true } },
      pagamentos: { select: { metodo: true } },
    },
  });

  const filtradas = comandas
    .filter((item: any) => {
      if (!qLower) return true;

      const cliente = String(item?.cliente?.nome ?? "").toLowerCase();
      const profissional = String(item?.profissionalPrincipal?.nome ?? "").toLowerCase();
      const pagamento = String(
        item?.pagamentos?.[0]?.metodo ?? ""
      ).toLowerCase();
      const status = String(item?.status ?? "").toLowerCase();

      return (
        cliente.includes(qLower) ||
        profissional.includes(qLower) ||
        pagamento.includes(qLower) ||
        status.includes(qLower)
      );
    })
    .sort((a: any, b: any) =>
      toDateValue(b?.fechadaEm ?? b?.abertaEm) - toDateValue(a?.fechadaEm ?? a?.abertaEm)
    );

  const rows = filtradas.map((item: any) => {
    const total = Number(item?.total ?? item?.valor ?? 0);

    const dataVenda = item?.fechadaEm ?? item?.abertaEm;
    const pagamento = String(item?.pagamentos?.[0]?.metodo ?? "");

    return {
      data: formatDateTimeBR(dataVenda),
      cliente: String(item?.cliente?.nome ?? ""),
      profissional: String(item?.profissionalPrincipal?.nome ?? ""),
      formaPagamento: pagamento,
      status: String(item?.status ?? ""),
      totalFormatado: formatMoneyBR(total),
      _total: total,
    };
  });

  const totalVendas = rows.length;
  const totalFaturado = rows.reduce((acc, row) => acc + Number(row._total ?? 0), 0);
  const ticketMedio = totalVendas ? totalFaturado / totalVendas : 0;

  return {
    tipo: "vendas",
    title: "Relatório de vendas",
    subtitle: "Resumo geral de vendas",
    generatedAt: new Date().toISOString(),
    filters,
    company,
    summary: [
      { label: "Vendas", value: totalVendas },
      { label: "Faturamento", value: formatMoneyBR(totalFaturado) },
      { label: "Ticket médio", value: formatMoneyBR(ticketMedio) },
    ],
    columns: [
      { key: "data", label: "Data" },
      { key: "cliente", label: "Cliente" },
      { key: "profissional", label: "Profissional" },
      { key: "formaPagamento", label: "Pagamento", align: "center" },
      { key: "status", label: "Status", align: "center" },
      { key: "totalFormatado", label: "Total", align: "right" },
    ],
    rows,
  };
}