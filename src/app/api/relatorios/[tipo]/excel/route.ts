import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { getReportFilters } from "@/lib/reports/filters";
import { getReportData } from "@/lib/reports";
import type { ReportTipo } from "@/lib/reports/types";
import { buildReportExcelResponse } from "@/lib/reports/reportExcel";

const TIPOS = new Set<ReportTipo>([
  "clientes",
  "profissionais",
  "vendas",
  "estoque",
  "financeiro",
]);

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ tipo: string }> }
) {
  const user = await requireUser();
  const { tipo } = await context.params;

  if (!TIPOS.has(tipo as ReportTipo)) {
    return Response.json(
      { error: "Tipo de relatório inválido." },
      { status: 400 }
    );
  }

  const filters = getReportFilters(
    Object.fromEntries(req.nextUrl.searchParams.entries())
  );

  const report = await getReportData(tipo as ReportTipo, filters, user.empresaId);

  return buildReportExcelResponse(report);
}