import { prisma } from "@/lib/prisma";
import { buildCreatedAtWhere } from "./helpers";
import type { ReportCompany, ReportData, ReportFilters } from "./types";

export async function buildClientesReport(
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
    where.OR = [
      { nome: { contains: q } },
      { telefone: { contains: q } },
      { email: { contains: q } },
    ];
  }

  const clientes = await prisma.cliente.findMany({
    where,
    orderBy: { nome: "asc" },
  });

  const rows = clientes.map((cliente: any) => ({
    nome: String(cliente?.nome ?? ""),
    telefone: String(cliente?.telefone ?? ""),
  }));

  return {
    tipo: "clientes",
    title: "Relatório de clientes",
    subtitle: "Cadastro básico",
    generatedAt: new Date().toISOString(),
    filters,
    company,
    summary: [
      { label: "Clientes", value: rows.length },
      {
        label: "Com telefone",
        value: rows.filter((r) => r.telefone.trim() !== "").length,
      },
    ],
    columns: [
      { key: "nome", label: "Cliente" },
      { key: "telefone", label: "Telefone" },
    ],
    rows,
  };
}
