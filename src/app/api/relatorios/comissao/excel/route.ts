import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import ExcelJS from "exceljs";

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    if (!user) return new NextResponse("Unauthorized", { status: 401 });

    const { searchParams } = new URL(req.url);
    const inicioStr = searchParams.get("inicio");
    const fimStr = searchParams.get("fim");
    const profissionalId = searchParams.get("profissionalId") || undefined;

    let inicio: Date | undefined;
    let fim: Date | undefined;

    if (inicioStr) {
      inicio = new Date(inicioStr);
      inicio.setHours(0, 0, 0, 0);
    }
    if (fimStr) {
      fim = new Date(fimStr);
      fim.setHours(23, 59, 59, 999);
    }

    const where: any = {
      comanda: {
        empresaId: user.empresaId,
        status: "FECHADA",
        fechadaEm: {
          not: null,
          ...(inicio || fim ? {} : undefined),
        },
      },
      tipo: "SERVICO",
    };

    if (inicio) where.comanda.fechadaEm.gte = inicio;
    if (fim) where.comanda.fechadaEm.lte = fim;

    if (profissionalId) {
      where.profissionalId = profissionalId;
    } else {
      where.profissionalId = { not: null };
    }

    const itens = await prisma.comandaItem.findMany({
      where,
      include: {
        profissional: {
          select: { nome: true },
        },
        comanda: {
          select: { fechadaEm: true },
        },
      },
      orderBy: {
        comanda: {
          fechadaEm: "asc",
        },
      },
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Comissões e Serviços");

    sheet.columns = [
      { header: "Profissional", key: "profissional", width: 25 },
      { header: "Serviço Realizado", key: "servico", width: 35 },
      { header: "Data de Fechamento", key: "data", width: 20 },
      { header: "Valor Serviço (R$)", key: "valor", width: 18 },
      { header: "Comissão (%)", key: "percentual", width: 15 },
      { header: "Comissão (R$)", key: "comissao", width: 18 },
    ];

    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF7C3AED" }, // Brand purple
    };
    sheet.getRow(1).font = { color: { argb: "FFFFFFFF" }, bold: true };

    itens.forEach((item) => {
      sheet.addRow({
        profissional: item.profissional?.nome || "Desconhecido",
        servico: item.descricao,
        data: item.comanda?.fechadaEm
          ? new Intl.DateTimeFormat("pt-BR").format(item.comanda.fechadaEm)
          : "-",
        valor: Number(item.valorTotal),
        percentual: Number(item.comissaoPercentual || 0),
        comissao: Number(item.valorComissao || 0),
      });
    });

    // Formating currency columns
    sheet.getColumn("valor").numFmt = "R$ #,##0.00";
    sheet.getColumn("comissao").numFmt = "R$ #,##0.00";
    sheet.getColumn("percentual").numFmt = "0.00%";

    const buffer = await workbook.xlsx.writeBuffer();

    const headers = new Headers();
    headers.set(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    headers.set(
      "Content-Disposition",
      `attachment; filename="relatorio-comissoes-${Date.now()}.xlsx"`
    );

    return new NextResponse(buffer as BlobPart, { headers });
  } catch (error) {
    console.error(error);
    return new NextResponse("Erro ao gerar Excel", { status: 500 });
  }
}
