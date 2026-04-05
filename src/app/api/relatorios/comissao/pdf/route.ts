import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

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
      inicio = new Date(inicioStr + "T00:00:00");
    }
    if (fimStr) {
      fim = new Date(fimStr + "T23:59:59.999");
    }

    const where: any = {
      tipo: "SERVICO",
    };

    where.comanda = {
      empresaId: user.empresaId,
      status: "FECHADA",
      fechadaEm: { not: null },
    };

    if (inicio || fim) {
      where.comanda.fechadaEm = {};
      if (inicio) where.comanda.fechadaEm.gte = inicio;
      if (fim) where.comanda.fechadaEm.lte = fim;
    }

    if (profissionalId && profissionalId !== "undefined" && profissionalId !== "") {
      where.profissionalId = profissionalId;
    } else {
      where.profissionalId = { not: null };
    }

    // Obter dados da empresa
    const empresa = await prisma.empresa.findUnique({
      where: { id: user.empresaId },
      include: { logo: true }
    });
    const nomeEmpresa = empresa?.nomeFantasia || empresa?.razaoSocial || "Salão de Beleza";

    const itens = await prisma.comandaItem.findMany({
      where,
      include: {
        profissional: { select: { nome: true } },
        comanda: { select: { fechadaEm: true, numeroSequencial: true } },
      },
      orderBy: { comanda: { fechadaEm: "asc" } },
    });

    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    let page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    let y = height - 50;

    const sanitize = (str: string) => str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\x20-\x7E]/g, "") : "";

    // Header Background
    page.drawRectangle({
      x: 40,
      y: y - 50,
      width: width - 80,
      height: 70,
      color: rgb(0.06, 0.09, 0.16), // #0f172a
    });

    // Try to embed logo if exists
    let logoImage;
    if (empresa?.logo?.url) {
      try {
        let finalUrl = empresa.logo.url;
        if (finalUrl.startsWith("/")) {
          const host = req.headers.get("host") || "localhost:3000";
          const protocol = req.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
          finalUrl = `${protocol}://${host}${finalUrl}`;
        }
        
        const logoRes = await fetch(finalUrl);
        if (logoRes.ok) {
          const logoBuffer = await logoRes.arrayBuffer();
          if (finalUrl.toLowerCase().endsWith(".png")) {
            logoImage = await pdfDoc.embedPng(logoBuffer);
          } else {
            logoImage = await pdfDoc.embedJpg(logoBuffer);
          }
        }
      } catch (e) {
        console.error("Erro ao carregar logo no PDF:", e);
      }
    }

    if (logoImage) {
      // White box for logo
      page.drawRectangle({
        x: 55,
        y: y - 40,
        width: 50,
        height: 50,
        color: rgb(1, 1, 1),
      });
      // Scale logo to fit 40x40
      const imgDims = logoImage.scaleToFit(40, 40);
      page.drawImage(logoImage, {
        x: 55 + (50 - imgDims.width) / 2,
        y: y - 40 + (50 - imgDims.height) / 2,
        width: imgDims.width,
        height: imgDims.height,
      });
    }

    const textStartX = logoImage ? 120 : 55;

    // Header Text
    page.drawText(sanitize(nomeEmpresa), {
      x: textStartX,
      y: y - 10,
      size: 16,
      font: fontBold,
      color: rgb(1, 1, 1),
    });

    page.drawText("Relatorio de Comissoes e Servicos", {
      x: textStartX,
      y: y - 25,
      size: 11,
      font: fontBold,
      color: rgb(0.8, 0.8, 0.8),
    });

    const periodoStr = `Período selecionado: ${inicio ? new Intl.DateTimeFormat("pt-BR").format(inicio) : "Início"} até ${fim ? new Intl.DateTimeFormat("pt-BR").format(fim) : "Hoje"}`;
    page.drawText(sanitize(periodoStr), {
      x: textStartX,
      y: y - 38,
      size: 9,
      font,
      color: rgb(0.6, 0.6, 0.6),
    });

    y -= 80;

    let totalServico = 0;
    let totalComissao = 0;

    for (const item of itens) {
      const valor = Number(item.valorTotal) || 0;
      const comissao = Number(item.valorComissao) || 0;
      totalServico += valor;
      totalComissao += comissao;
    }

    // Summary Boxes
    const boxWidth = (width - 80 - 20) / 2;
    // Box 1
    page.drawRectangle({
      x: 40,
      y: y - 35,
      width: boxWidth,
      height: 45,
      color: rgb(0.95, 0.95, 0.96),
      borderColor: rgb(0.85, 0.85, 0.88),
      borderWidth: 1,
    });
    page.drawText("Faturamento", { x: 50, y: y - 10, size: 8, font, color: rgb(0.4, 0.4, 0.5) });
    page.drawText(`R$ ${totalServico.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`, { x: 50, y: y - 25, size: 12, font: fontBold, color: rgb(0.1, 0.1, 0.1) });

    // Box 2
    page.drawRectangle({
      x: 40 + boxWidth + 20,
      y: y - 35,
      width: boxWidth,
      height: 45,
      color: rgb(0.95, 0.95, 0.96),
      borderColor: rgb(0.85, 0.85, 0.88),
      borderWidth: 1,
    });
    page.drawText("Total de Comissoes", { x: 40 + boxWidth + 30, y: y - 10, size: 8, font, color: rgb(0.4, 0.4, 0.5) });
    page.drawText(`R$ ${totalComissao.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`, { x: 40 + boxWidth + 30, y: y - 25, size: 12, font: fontBold, color: rgb(0.1, 0.1, 0.1) });

    y -= 50;

    const emitidoEmStr = `Emitido em: ${new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date())}`;
    page.drawText(sanitize(emitidoEmStr), { x: 40, y: y - 10, size: 8, font, color: rgb(0.5, 0.5, 0.5) });

    y -= 30;

    const cols = [40, 160, 310, 390, 470];
    const headersContent = ["Profissional", "Servico", "Data", "Valor", "Comissao"];
    
    // Draw row background header
    page.drawRectangle({
      x: 40,
      y: y - 5,
      width: width - 80,
      height: 20,
      color: rgb(0.9, 0.92, 0.95), // header background like screenshot
    });

    headersContent.forEach((h, i) => {
      page.drawText(h, { x: cols[i] + 5, y, size: 9, font: fontBold, color: rgb(0.1, 0.1, 0.2) });
    });

    y -= 25;

    for (const item of itens) {
      if (y < 50) {
        page = pdfDoc.addPage();
        y = height - 50;
      }

      const dataStr = item.comanda?.fechadaEm
        ? new Intl.DateTimeFormat("pt-BR").format(item.comanda.fechadaEm)
        : "-";
      const valor = Number(item.valorTotal) || 0;
      const comissao = Number(item.valorComissao) || 0;

      page.drawText(sanitize((item.profissional?.nome || "Secundario").substring(0, 18)), { x: cols[0] + 5, y, size: 9, font });
      page.drawText(sanitize(item.descricao.substring(0, 30)), { x: cols[1] + 5, y, size: 9, font });
      page.drawText(dataStr, { x: cols[2] + 5, y, size: 9, font });
      page.drawText(`R$ ${valor.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`, { x: cols[3] + 5, y, size: 9, font });
      page.drawText(`R$ ${comissao.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`, { x: cols[4] + 5, y, size: 9, font });

      // separator line
      y -= 10;
      page.drawLine({
        start: { x: 40, y: y + 5 },
        end: { x: width - 40, y: y + 5 },
        thickness: 0.5,
        color: rgb(0.9, 0.9, 0.9)
      });
      y -= 10;
    }

    const pdfBytes = await pdfDoc.save();

    const responseHeaders = new Headers();
    responseHeaders.set("Content-Type", "application/pdf");
    responseHeaders.set(
      "Content-Disposition",
      `attachment; filename="relatorio-comissoes-${Date.now()}.pdf"`
    );

    return new NextResponse(Buffer.from(pdfBytes), { headers: responseHeaders });
  } catch (error: any) {
    console.error(error);
    return new NextResponse(`Erro ao gerar PDF: ${error.message || error.toString()}\n\nStack:\n${error.stack}`, { status: 500 });
  }
}
