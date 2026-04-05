import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { buildPdvReport } from "@/lib/reports/pdv";
import { getCompany } from "@/lib/reports";
import { buildReportPdfResponse } from "@/lib/reports/reportPdf";
import { ReportFilters } from "@/lib/reports/types";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();

    // Extract filters from URL
    const de = request.nextUrl.searchParams.get("de");
    const ate = request.nextUrl.searchParams.get("ate");
    const dia = request.nextUrl.searchParams.get("dia");
    const q = request.nextUrl.searchParams.get("q");
    const status = request.nextUrl.searchParams.get("status");

    const filters: ReportFilters = {
      ...(de && { de }),
      ...(ate && { ate }),
      ...(dia && { dia }),
      ...(q && { q }),
      ...(status && { status }),
    };

    // Get company info
    const company = await getCompany(user.empresaId);

    // Build report
    const report = await buildPdvReport(filters, company, user.empresaId);

    // Generate PDF
    return buildReportPdfResponse(report);
  } catch (error) {
    console.error("Erro ao gerar PDF do PDV:", error);
    return NextResponse.json(
      { error: "Erro ao gerar PDF" },
      { status: 500 }
    );
  }
}
