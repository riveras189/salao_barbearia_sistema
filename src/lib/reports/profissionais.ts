import { prisma } from "@/lib/prisma";
import { formatMoneyBR, buildCreatedAtWhere } from "./helpers";
import type { ReportCompany, ReportData, ReportFilters } from "./types";

export async function buildProfissionaisReport(
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
    where.nome = { contains: q };
  }

  const profissionais = await prisma.profissional.findMany({
    where,
    orderBy: { nome: "asc" },
  });

  const rows = profissionais
    .map((item: any) => ({
      nome: String(item?.nome ?? ""),
      status:
        item?.ativo === true
          ? "Ativo"
          : item?.ativo === false
          ? "Inativo"
          : "",
      telefone: String(item?.telefone ?? ""),
      email: String(item?.email ?? ""),
      faturamentoFormatado: formatMoneyBR(0),
      comissaoFormatada: formatMoneyBR(0),
    }))
    .sort((a: any, b: any) =>
      String(a?.nome ?? "").localeCompare(String(b?.nome ?? ""), "pt-BR")
    );

  return {
    tipo: "profissionais",
    title: "Relatório de profissionais",
    subtitle: "Cadastro básico de profissionais",
    generatedAt: new Date().toISOString(),
    filters,
    company,
    summary: [
      { label: "Profissionais", value: rows.length },
      {
        label: "Ativos",
        value: rows.filter((r) => r.status === "Ativo").length,
      },
    ],
    columns: [
      { key: "nome", label: "Profissional" },
      { key: "telefone", label: "Telefone" },
      { key: "email", label: "E-mail" },
      { key: "status", label: "Status", align: "center" },
    ],
    rows,
  };
}
