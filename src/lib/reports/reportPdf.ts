import {
  PDFDocument,
  PageSizes,
  StandardFonts,
  rgb,
} from "pdf-lib";
import type { ReportData } from "./types";
import { loadReportImage } from "./reportAssets";

function toText(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value);
}

function wrapText(
  text: string,
  maxWidth: number,
  font: any,
  fontSize: number
) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    const width = font.widthOfTextAtSize(test, fontSize);

    if (width <= maxWidth) {
      current = test;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }

  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

export async function buildReportPdfResponse(report: ReportData) {
  const pdfDoc = await PDFDocument.create();

  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const logoAsset = await loadReportImage(report.company.logoUrl);
  const logoImage = logoAsset
    ? logoAsset.extension === "png"
      ? await pdfDoc.embedPng(logoAsset.bytes)
      : await pdfDoc.embedJpg(logoAsset.bytes)
    : null;

  const landscape = report.columns.length > 6;
  const base = PageSizes.A4;
  const pageSize: [number, number] = landscape
    ? [base[1], base[0]]
    : [base[0], base[1]];

  const margin = 36;
  const lineHeight = 10;

  let page = pdfDoc.addPage(pageSize);
  let { width, height } = page.getSize();
  let y = height - margin;

  const addPage = () => {
    page = pdfDoc.addPage(pageSize);
    ({ width, height } = page.getSize());
    y = height - margin;
  };

  const drawHeader = () => {
    page.drawRectangle({
      x: margin,
      y: height - 92,
      width: width - margin * 2,
      height: 56,
      color: rgb(0.06, 0.09, 0.16),
    });

    let textX = margin + 12;

    if (logoImage) {
      const maxWidth = 44;
      const maxHeight = 36;
      const scale = Math.min(
        maxWidth / logoImage.width,
        maxHeight / logoImage.height
      );

      const imgWidth = logoImage.width * scale;
      const imgHeight = logoImage.height * scale;

      page.drawImage(logoImage, {
        x: margin + 10,
        y: height - 80,
        width: imgWidth,
        height: imgHeight,
      });

      textX = margin + 10 + imgWidth + 12;
    }

    page.drawText(report.company.companyName || "Sistema Administrativo", {
      x: textX,
      y: height - 58,
      size: 16,
      font: bold,
      color: rgb(1, 1, 1),
    });

    page.drawText(report.title, {
      x: textX,
      y: height - 76,
      size: 11,
      font: bold,
      color: rgb(0.9, 0.93, 0.98),
    });

    if (report.subtitle) {
      page.drawText(report.subtitle, {
        x: textX,
        y: height - 88,
        size: 8,
        font: regular,
        color: rgb(0.8, 0.85, 0.92),
      });
    }

    y = height - 110;
  };

  const drawSummary = () => {
    const items = (report.summary || []).slice(0, 4);
    if (!items.length) return;

    const gap = 10;
    const boxWidth =
      (width - margin * 2 - gap * (items.length - 1)) / items.length;
    const boxHeight = 42;

    items.forEach((item, index) => {
      const x = margin + index * (boxWidth + gap);

      page.drawRectangle({
        x,
        y: y - boxHeight,
        width: boxWidth,
        height: boxHeight,
        color: rgb(0.97, 0.98, 0.99),
        borderColor: rgb(0.88, 0.9, 0.94),
        borderWidth: 1,
      });

      page.drawText(toText(item.label), {
        x: x + 8,
        y: y - 14,
        size: 8,
        font: regular,
        color: rgb(0.39, 0.45, 0.53),
      });

      page.drawText(toText(item.value), {
        x: x + 8,
        y: y - 30,
        size: 12,
        font: bold,
        color: rgb(0.06, 0.09, 0.16),
      });
    });

    y -= boxHeight + 18;
  };

  const drawMeta = () => {
    page.drawText(
      `Emitido em: ${new Date(report.generatedAt).toLocaleString("pt-BR")}`,
      {
        x: margin,
        y,
        size: 8,
        font: regular,
        color: rgb(0.39, 0.45, 0.53),
      }
    );

    y -= 16;
  };

  const drawFilters = () => {
    // Convert filters object to array of {label, value} for display
    const filterEntries = Object.entries(report.filters || {})
      .filter(([, value]) => value !== undefined && value !== null && value !== "")
      .map(([key, value]) => ({
        label: key.charAt(0).toUpperCase() + key.slice(1),
        value: String(value),
      }));

    if (!filterEntries.length) return;

    page.drawText("Filtros aplicados:", {
      x: margin,
      y,
      size: 9,
      font: bold,
      color: rgb(0.06, 0.09, 0.16),
    });

    y -= 14;

    for (const item of filterEntries) {
      const text = `${toText(item.label)}: ${toText(item.value)}`;
      const lines = wrapText(text, width - margin * 2, regular, 8);

      for (const line of lines) {
        if (y < margin + 30) {
          addPage();
          drawHeader();
        }

        page.drawText(line, {
          x: margin,
          y,
          size: 8,
          font: regular,
          color: rgb(0.25, 0.29, 0.34),
        });

        y -= 11;
      }
    }

    y -= 8;
  };

  const drawTableHeader = () => {
    page.drawRectangle({
      x: margin,
      y: y - 18,
      width: width - margin * 2,
      height: 18,
      color: rgb(0.89, 0.92, 0.96),
    });

    const headerLine = report.columns.map((c) => c.label).join(" | ");

    page.drawText(headerLine, {
      x: margin + 6,
      y: y - 12,
      size: 8,
      font: bold,
      color: rgb(0.06, 0.09, 0.16),
      maxWidth: width - margin * 2 - 12,
    });

    y -= 24;
  };

  drawHeader();
  drawSummary();
  drawMeta();
  drawFilters();
  drawTableHeader();

  const maxTextWidth = width - margin * 2 - 12;

  for (const row of report.rows) {
    const line = report.columns
      .map((col) => toText((row as Record<string, unknown>)[col.key]))
      .join(" | ");

    const lines = wrapText(line, maxTextWidth, regular, 8);
    const rowHeight = lines.length * lineHeight + 8;

    if (y - rowHeight < margin + 20) {
      addPage();
      drawHeader();
      drawTableHeader();
    }

    page.drawRectangle({
      x: margin,
      y: y - rowHeight + 2,
      width: width - margin * 2,
      height: rowHeight,
      color: rgb(1, 1, 1),
      borderColor: rgb(0.9, 0.92, 0.95),
      borderWidth: 1,
    });

    lines.forEach((txt, index) => {
      page.drawText(txt, {
        x: margin + 6,
        y: y - 10 - index * lineHeight,
        size: 8,
        font: regular,
        color: rgb(0.1, 0.12, 0.16),
        maxWidth: maxTextWidth,
      });
    });

    y -= rowHeight + 4;
  }

  const pages = pdfDoc.getPages();
  pages.forEach((p, index) => {
    const { width: pw } = p.getSize();

    p.drawText(`Página ${index + 1} de ${pages.length}`, {
      x: pw / 2 - 30,
      y: 16,
      size: 8,
      font: regular,
      color: rgb(0.45, 0.5, 0.56),
    });
  });

  const pdfBytes = await pdfDoc.save();

  return new Response(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${report.tipo}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}