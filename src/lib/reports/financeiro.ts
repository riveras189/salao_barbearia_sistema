import { prisma } from "@/lib/prisma";
import { formatMoneyBR, buildCreatedAtWhere } from "./helpers";
import type { ReportCompany, ReportData, ReportFilters } from "./types";

export async function buildFinanceiroReport(
  filters: ReportFilters,
  company: ReportCompany,
  empresaId?: string
): Promise<ReportData> {
  const dateWhere = buildCreatedAtWhere(filters);

  const comandaWhere: any = {
    ...(empresaId ? { empresaId } : {}),
    status: "FECHADA",
  };

  if (dateWhere) {
    comandaWhere.fechadaEm = dateWhere;
  }

  const contaReceberWhere: any = {
    ...(empresaId ? { empresaId } : {}),
  };

  if (dateWhere) {
    contaReceberWhere.createdAt = dateWhere;
  }

  const contaPagarWhere: any = {
    ...(empresaId ? { empresaId } : {}),
  };

  if (dateWhere) {
    contaPagarWhere.createdAt = dateWhere;
  }

  const caixaWhere: any = {
    ...(empresaId ? { empresaId } : {}),
  };

  if (dateWhere) {
    caixaWhere.dataMovimento = dateWhere;
  }

  const [comandas, contasReceber, contasPagar, caixaMovimentos] = await Promise.all([
    prisma.comanda.findMany({ where: comandaWhere }),
    prisma.contaReceber.findMany({ where: contaReceberWhere }),
    prisma.contaPagar.findMany({ where: contaPagarWhere }),
    prisma.caixaMovimento.findMany({ where: caixaWhere }),
  ]);

  const receitaComandas = comandas.reduce(
    (acc: number, item: any) => acc + Number(item?.total ?? item?.valorTotal ?? 0),
    0
  );

  const receitaReceber = contasReceber.reduce(
    (acc: number, item: any) => acc + Number(item?.valor ?? 0),
    0
  );

  const despesasPagar = contasPagar.reduce(
    (acc: number, item: any) => acc + Number(item?.valor ?? 0),
    0
  );

  const saldoCaixa = caixaMovimentos.reduce((acc: number, item: any) => {
    const tipo = String(item?.tipo ?? "").toLowerCase();
    const valor = Number(item?.valor ?? 0);

    if (tipo.includes("entrada")) return acc + valor;
    if (tipo.includes("saida") || tipo.includes("saída")) return acc - valor;

    return acc;
  }, 0);

  const receita = receitaComandas + receitaReceber;
  const despesas = despesasPagar;
  const lucro = receita - despesas;

  const rows = [
    {
      grupo: "Receita de comandas",
      valorFormatado: formatMoneyBR(receitaComandas),
    },
    {
      grupo: "Contas a receber",
      valorFormatado: formatMoneyBR(receitaReceber),
    },
    {
      grupo: "Contas a pagar",
      valorFormatado: formatMoneyBR(despesasPagar),
    },
    {
      grupo: "Saldo do caixa",
      valorFormatado: formatMoneyBR(saldoCaixa),
    },
    {
      grupo: "Lucro",
      valorFormatado: formatMoneyBR(lucro),
    },
  ];

  return {
    tipo: "financeiro",
    title: "Relatório financeiro",
    subtitle: "Receitas, despesas e saldo",
    generatedAt: new Date().toISOString(),
    filters,
    company,
    summary: [
      { label: "Receita", value: formatMoneyBR(receita) },
      { label: "Despesas", value: formatMoneyBR(despesas) },
      { label: "Lucro", value: formatMoneyBR(lucro) },
      { label: "Caixa", value: formatMoneyBR(saldoCaixa) },
    ],
    columns: [
      { key: "grupo", label: "Grupo" },
      { key: "valorFormatado", label: "Valor", align: "right" },
    ],
    rows,
  };
}