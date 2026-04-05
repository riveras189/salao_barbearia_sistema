import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { getReportFilters } from "@/lib/reports/filters";
import { getReportData } from "@/lib/reports";
import type { ReportTipo } from "@/lib/reports/types";
import { buildReportPdfResponse } from "@/lib/reports/reportPdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
  try {
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

    const report = await getReportData(
      tipo as ReportTipo,
      filters,
      user.empresaId
    );

    return await buildReportPdfResponse(report);
  } catch (error) {
    console.error("Erro ao gerar PDF do relatório:", error);

    return Response.json(
      {
        error: "Erro ao gerar PDF.",
        message:
          error instanceof Error ? error.message : "Erro interno no servidor.",
      },
      { status: 500 }
    );
  }
}