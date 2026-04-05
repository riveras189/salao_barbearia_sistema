import { prisma } from "@/lib/prisma";
import { ReportData, ReportCompany, ReportFilters } from "./types";
import { getCurrentTimeForTimezone } from "@/lib/agenda";

export async function buildPdvReport(
  filters: ReportFilters,
  company: ReportCompany,
  empresaId?: string
): Promise<ReportData> {
  if (!empresaId) throw new Error("Empresa não identificada");

  // Build Prisma query
  const where: any = {
    empresaId,
  };

  // Data range filter
  if (filters.de || filters.ate) {
    const from = filters.de ? new Date(filters.de) : new Date(0);
    const to = filters.ate ? new Date(filters.ate) : new Date();

    where.dataCriacao = {
      gte: from,
      lte: to,
    };
  } else if (filters.dia) {
    const date = new Date(filters.dia);
    where.dataCriacao = {
      gte: date,
      lte: new Date(date.getTime() + 24 * 60 * 60 * 1000),
    };
  }

  // Payment method filter
  if (filters.q) {
    where.OR = [
      { observacoes: { contains: filters.q, mode: "insensitive" } },
      { usuario: { nome: { contains: filters.q, mode: "insensitive" } } },
    ];
  }

  // Form payment filter (se passar como tipo)
  if (filters.status) {
    where.formaPagamento = filters.status;
  }

  const vendas = await prisma.vendaPdv.findMany({
    where,
    include: {
      itens: {
        include: {
          produto: { select: { nome: true, preco: true, comissao: true } },
        },
      },
      usuario: { select: { nome: true } },
    },
    orderBy: { dataCriacao: "desc" },
  });

  // Transform to rows
  const rows = vendas.map((venda) => {
    const comissaoTotal = venda.itens.reduce((sum, item) => {
      const comissaoItem =
        Number(item.quantidade) *
        Number(item.produto.preco) *
        (Number(item.produto.comissao) / 100);
      return sum + comissaoItem;
    }, 0);

    return {
      id: venda.id,
      data: venda.dataCriacao.toLocaleDateString("pt-BR"),
      hora: venda.dataCriacao.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      usuario: venda.usuario?.nome || "—",
      itens: venda.itens.length,
      produtos: venda.itens
        .map((i) => `${i.produto.nome} (${i.quantidade})`)
        .join(", "),
      subtotal: Number(venda.subtotal),
      desconto: Number(venda.desconto),
      acrescimo: Number(venda.acrescimo),
      comissao: comissaoTotal,
      total: Number(venda.total),
      formaPagamento: venda.formaPagamento,
      observacoes: venda.observacoes || "—",
    };
  });

  // Calculate summaries
  const totalVendas = rows.length;
  const totalRecebido = rows
    .filter((r) => r.formaPagamento !== "FIADO")
    .reduce((sum, r) => sum + r.total, 0);
  const totalFiado = rows
    .filter((r) => r.formaPagamento === "FIADO")
    .reduce((sum, r) => sum + r.total, 0);
  const totalDesconto = rows.reduce((sum, r) => sum + r.desconto, 0);
  const totalAcrescimo = rows.reduce((sum, r) => sum + r.acrescimo, 0);
  const totalComissao = rows.reduce((sum, r) => sum + r.comissao, 0);
  const grandTotal = rows.reduce((sum, r) => sum + r.total, 0);

  const summary = [
    { label: "Total de Vendas", value: String(totalVendas) },
    { label: "Total Recebido", value: `R$ ${totalRecebido.toFixed(2)}` },
    { label: "Total Fiado", value: `R$ ${totalFiado.toFixed(2)}` },
    { label: "Total Descontos", value: `R$ ${totalDesconto.toFixed(2)}` },
    { label: "Total Acréscimos", value: `R$ ${totalAcrescimo.toFixed(2)}` },
    { label: "Total Comissões", value: `R$ ${totalComissao.toFixed(2)}` },
    {
      label: "TOTAL GERAL",
      value: `R$ ${grandTotal.toFixed(2)}`,
      highlight: true,
    },
  ];

  return {
    tipo: "pdv",
    title: "Relatório de PDV",
    subtitle: "Vendas rápidas por ponto de venda",
    generatedAt: getCurrentTimeForTimezone(),
    filters,
    company,
    summary,
    columns: [
      { key: "data", label: "Data" },
      { key: "hora", label: "Hora" },
      { key: "usuario", label: "Usuário" },
      { key: "itens", label: "Qtd Itens" },
      { key: "subtotal", label: "Subtotal", align: "right" },
      { key: "desconto", label: "Desconto", align: "right" },
      { key: "acrescimo", label: "Acréscimo", align: "right" },
      { key: "comissao", label: "Comissão", align: "right" },
      { key: "total", label: "Total", align: "right" },
      { key: "formaPagamento", label: "Pagamento" },
      { key: "observacoes", label: "Observações" },
    ],
    rows,
  };
}
