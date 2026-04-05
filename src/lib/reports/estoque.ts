import { prisma } from "@/lib/prisma";
import { formatMoneyBR, buildCreatedAtWhere } from "./helpers";
import type { ReportCompany, ReportData, ReportFilters } from "./types";

export async function buildEstoqueReport(
  filters: ReportFilters,
  company: ReportCompany,
  empresaId?: string
): Promise<ReportData> {
  const q = String(filters.q ?? "").trim();
  const createdAtWhere = buildCreatedAtWhere(filters);

  const where: any = {};

  if (empresaId) {
    where.empresaId = empresaId;
  }

  if (createdAtWhere) {
    where.createdAt = createdAtWhere;
  }

  if (q) {
    where.nome = { contains: q, mode: "insensitive" };
  }

  const produtos = await prisma.produto.findMany({
    where,
    orderBy: { nome: "asc" },
  });

  const rows = produtos
    .map((item: any) => {
      const estoqueAtual = Number(
        item?.estoqueAtual ?? item?.estoque ?? item?.quantidade ?? 0
      );
      const estoqueMinimo = Number(item?.estoqueMinimo ?? item?.minimo ?? 0);
      const custo = Number(item?.custo ?? item?.custoUnitario ?? 0);
      const valorEstoque = estoqueAtual * custo;

      return {
        produto: String(item?.nome ?? ""),
        estoqueAtual,
        estoqueMinimo,
        situacao:
          estoqueAtual <= 0
            ? "Zerado"
            : estoqueMinimo > 0 && estoqueAtual <= estoqueMinimo
            ? "Crítico"
            : "Normal",
        valorEstoqueFormatado: formatMoneyBR(valorEstoque),
        _valorEstoque: valorEstoque,
      };
    })
    .sort((a: any, b: any) =>
      String(a?.nome ?? "").localeCompare(String(b?.nome ?? ""), "pt-BR")
    );

  const criticos = rows.filter((r) => r.situacao === "Crítico").length;
  const zerados = rows.filter((r) => r.situacao === "Zerado").length;
  const valorTotal = rows.reduce(
    (acc, row) => acc + Number(row._valorEstoque ?? 0),
    0
  );

  return {
    tipo: "estoque",
    title: "Relatório de estoque",
    subtitle: "Resumo geral do estoque",
    generatedAt: new Date().toISOString(),
    filters,
    company,
    summary: [
      { label: "Produtos", value: rows.length },
      { label: "Críticos", value: criticos },
      { label: "Zerados", value: zerados },
      { label: "Valor em estoque", value: formatMoneyBR(valorTotal) },
    ],
    columns: [
      { key: "produto", label: "Produto" },
      { key: "estoqueAtual", label: "Atual", align: "right" },
      { key: "estoqueMinimo", label: "Mínimo", align: "right" },
      { key: "situacao", label: "Situação", align: "center" },
      { key: "valorEstoqueFormatado", label: "Valor estoque", align: "right" },
    ],
    rows,
  };
}