import { prisma } from "@/lib/prisma";
import type { ReportData, ReportFilters, ReportTipo } from "./types";
import { buildClientesReport } from "./clientes";
import { buildProfissionaisReport } from "./profissionais";
import { buildVendasReport } from "./vendas";
import { buildEstoqueReport } from "./estoque";
import { buildFinanceiroReport } from "./financeiro";
import { buildPdvReport } from "./pdv";

async function getCompany(empresaId?: string) {
  const empresa = empresaId
    ? await prisma.empresa.findUnique({
        where: { id: empresaId },
        select: {
          nomeFantasia: true,
          razaoSocial: true,
          logo: {
            select: {
              url: true,
            },
          },
        },
      })
    : await prisma.empresa.findFirst({
        orderBy: { createdAt: "asc" },
        select: {
          nomeFantasia: true,
          razaoSocial: true,
          logo: {
            select: {
              url: true,
            },
          },
        },
      });

  return {
    companyName:
      empresa?.nomeFantasia ||
      empresa?.razaoSocial ||
      "Sistema Administrativo",
    logoUrl: empresa?.logo?.url || null,
  };
}

export { getCompany };

export async function getReportData(
  tipo: ReportTipo,
  filters: ReportFilters,
  empresaId?: string
): Promise<ReportData> {
  const company = await getCompany(empresaId);

  switch (tipo) {
    case "clientes":
      return buildClientesReport(filters, company, empresaId);

    case "profissionais":
      return buildProfissionaisReport(filters, company, empresaId);

    case "vendas":
      return buildVendasReport(filters, company, empresaId);

    case "estoque":
      return buildEstoqueReport(filters, company, empresaId);

    case "financeiro":
      return buildFinanceiroReport(filters, company, empresaId);

    case "pdv":
      return buildPdvReport(filters, company, empresaId);

    default:
      throw new Error("Tipo de relatório inválido.");
  }
}