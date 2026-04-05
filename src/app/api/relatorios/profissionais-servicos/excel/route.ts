import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { getRelatorioServicosProfissionais } from "@/lib/reports/getRelatorioServicosProfissionais";
import { buildReportExcelResponse } from "@/lib/reports/reportExcel";

function formatDateBR(value?: string | null) {
  if (!value) return "Todos";
  const [y, m, d] = value.split("-");
  if (!y || !m || !d) return value;
  return `${d}/${m}/${y}`;
}

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);

    const inicio = searchParams.get("inicio") || "";
    const fim = searchParams.get("fim") || "";
    const profissionalId = searchParams.get("profissionalId") || "";
    const servicoId = searchParams.get("servicoId") || "";

    const [empresa, profissional, servico] = await Promise.all([
      prisma.empresa.findFirst({
        where: { id: user.empresaId },
        select: {
          nomeFantasia: true,
          razaoSocial: true,
          logo: true,
        },
      }),
      profissionalId
        ? prisma.profissional.findFirst({
            where: {
              id: profissionalId,
              empresaId: user.empresaId,
            },
            select: { nome: true },
          })
        : null,
      servicoId
        ? prisma.servico.findFirst({
            where: {
              id: servicoId,
              empresaId: user.empresaId,
            },
            select: { nome: true },
          })
        : null,
    ]);

    const relatorio = await getRelatorioServicosProfissionais({
      empresaId: user.empresaId,
      inicio,
      fim,
      profissionalId,
      servicoId,
    });

    return await buildReportExcelResponse({
      tipo: "profissionais-servicos",
      title: "Relatório de Serviços por Profissional",
      subtitle: "Serviços concluídos em comandas fechadas",
      generatedAt: new Date().toISOString(),
      company: {
        companyName:
          empresa?.nomeFantasia ||
          empresa?.razaoSocial ||
          "Sistema Administrativo",
        logoUrl: empresa?.logo?.url || "",
      },
      filters: {
        de: inicio || undefined,
        ate: fim || undefined,
        profissionalId: profissionalId || undefined,
        servicoId: servicoId || undefined,
      },
      summary: [
        { label: "Registros", value: String(relatorio.rows.length) },
        { label: "Quantidade", value: String(relatorio.totalQuantidade) },
        {
          label: "Valor total",
          value: `R$ ${relatorio.totalValor.toLocaleString("pt-BR", {
            minimumFractionDigits: 2,
          })}`,
        },
      ],
      columns: [
        { key: "profissional", label: "Profissional" },
        { key: "servico", label: "Serviço" },
        { key: "quantidade", label: "Quantidade", align: "center" },
        { key: "valorTotal", label: "Valor total", align: "right" },
      ],
      rows: relatorio.rows.map((item) => ({
        profissional: item.profissionalNome,
        servico: item.servicoDescricao,
        quantidade: item.quantidade,
        valorTotal: `R$ ${item.valorTotal.toLocaleString("pt-BR", {
          minimumFractionDigits: 2,
        })}`,
      })),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Erro ao gerar Excel.",
        message: error?.message || "Falha inesperada.",
      },
      { status: 500 }
    );
  }
}