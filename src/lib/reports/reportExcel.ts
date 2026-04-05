import ExcelJS from "exceljs";
import type { ReportData } from "./types";
import { loadReportImage } from "./reportAssets";

function getColumnLetter(index: number) {
  let result = "";
  let num = index;

  while (num > 0) {
    const mod = (num - 1) % 26;
    result = String.fromCharCode(65 + mod) + result;
    num = Math.floor((num - mod) / 26);
  }

  return result;
}

export async function buildReportExcelResponse(report: ReportData) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "ChatGPT";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(report.title.slice(0, 31), {
    views: [{ state: "frozen", ySplit: 12 }],
  });

  const totalCols = Math.max(report.columns.length, 6);
  const lastCol = getColumnLetter(totalCols);

  const logoAsset = await loadReportImage(report.company.logoUrl);

  if (logoAsset) {
    const imageId = workbook.addImage({
      buffer: Buffer.from(logoAsset.bytes) as any,
      extension: logoAsset.extension === "png" ? "png" : "jpeg",
    });

    sheet.addImage(imageId, {
      tl: { col: 0, row: 0 },
      ext: { width: 100, height: 60 },
    });

    sheet.mergeCells(`C1:${lastCol}1`);
    sheet.mergeCells(`C2:${lastCol}2`);
    sheet.mergeCells(`C3:${lastCol}3`);

    sheet.getCell("C1").value =
      report.company.companyName || "Sistema Administrativo";
    sheet.getCell("C2").value = report.title;
    sheet.getCell("C3").value = report.subtitle || "";

    ["C1", "C2", "C3"].forEach((cell) => {
      sheet.getCell(cell).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF0F172A" },
      };
      sheet.getCell(cell).alignment = {
        vertical: "middle",
        horizontal: "left",
      };
    });

    sheet.getCell("C1").font = {
      size: 16,
      bold: true,
      color: { argb: "FFFFFFFF" },
    };
    sheet.getCell("C2").font = {
      size: 13,
      bold: true,
      color: { argb: "FFFFFFFF" },
    };
    sheet.getCell("C3").font = {
      size: 10,
      color: { argb: "FFE2E8F0" },
    };
  } else {
    sheet.mergeCells(`A1:${lastCol}1`);
    sheet.mergeCells(`A2:${lastCol}2`);
    sheet.mergeCells(`A3:${lastCol}3`);

    sheet.getCell("A1").value =
      report.company.companyName || "Sistema Administrativo";
    sheet.getCell("A2").value = report.title;
    sheet.getCell("A3").value = report.subtitle || "";

    ["A1", "A2", "A3"].forEach((cell) => {
      sheet.getCell(cell).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF0F172A" },
      };
      sheet.getCell(cell).alignment = {
        vertical: "middle",
        horizontal: "left",
      };
    });

    sheet.getCell("A1").font = {
      size: 16,
      bold: true,
      color: { argb: "FFFFFFFF" },
    };
    sheet.getCell("A2").font = {
      size: 13,
      bold: true,
      color: { argb: "FFFFFFFF" },
    };
    sheet.getCell("A3").font = {
      size: 10,
      color: { argb: "FFE2E8F0" },
    };
  }

  sheet.getRow(1).height = 24;
  sheet.getRow(2).height = 22;
  sheet.getRow(3).height = 20;

  sheet.getCell("A5").value = `Emitido em: ${new Date(
    report.generatedAt
  ).toLocaleString("pt-BR")}`;
  sheet.getCell("A5").font = {
    size: 10,
    italic: true,
    color: { argb: "FF475569" },
  };

  let currentRow = 7;

  // Convert filters object to array of {label, value} for display
  const filterEntries = Object.entries(report.filters || {})
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(([key, value]) => ({
      label: key.charAt(0).toUpperCase() + key.slice(1),
      value: String(value),
    }));

  if (filterEntries.length) {
    sheet.mergeCells(`A${currentRow}:${lastCol}${currentRow}`);
    sheet.getCell(`A${currentRow}`).value = "Filtros aplicados";
    sheet.getCell(`A${currentRow}`).font = {
      size: 11,
      bold: true,
      color: { argb: "FF0F172A" },
    };

    currentRow += 1;

    filterEntries.forEach((item) => {
      sheet.mergeCells(`A${currentRow}:${lastCol}${currentRow}`);
      sheet.getCell(`A${currentRow}`).value = `${item.label}: ${item.value}`;
      sheet.getCell(`A${currentRow}`).font = {
        size: 10,
        color: { argb: "FF334155" },
      };
      currentRow += 1;
    });

    currentRow += 1;
  }

  if ((report.summary || []).length) {
    const summaryRow = currentRow;

    report.summary.forEach((item, index) => {
      const startCol = index * 2 + 1;
      const labelCell = `${getColumnLetter(startCol)}${summaryRow}`;
      const valueCell = `${getColumnLetter(startCol)}${summaryRow + 1}`;

      sheet.getCell(labelCell).value = item.label;
      sheet.getCell(valueCell).value = String(item.value ?? "");

      sheet.getCell(labelCell).font = {
        size: 9,
        bold: true,
        color: { argb: "FF64748B" },
      };
      sheet.getCell(valueCell).font = {
        size: 14,
        bold: true,
        color: { argb: "FF0F172A" },
      };

      [labelCell, valueCell].forEach((cell) => {
        sheet.getCell(cell).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF8FAFC" },
        };
        sheet.getCell(cell).border = {
          top: { style: "thin", color: { argb: "FFE2E8F0" } },
          left: { style: "thin", color: { argb: "FFE2E8F0" } },
          bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
          right: { style: "thin", color: { argb: "FFE2E8F0" } },
        };
        sheet.getCell(cell).alignment = {
          vertical: "middle",
          horizontal: "left",
        };
      });
    });

    currentRow += 4;
  }

  const headerRowNumber = currentRow;
  const headerRow = sheet.getRow(headerRowNumber);

  report.columns.forEach((col, index) => {
    const cell = headerRow.getCell(index + 1);
    cell.value = col.label;
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0F172A" },
    };
    cell.alignment = {
      vertical: "middle",
      horizontal:
        col.align === "right"
          ? "right"
          : col.align === "center"
          ? "center"
          : "left",
    };
    cell.border = {
      top: { style: "thin", color: { argb: "FF0F172A" } },
      left: { style: "thin", color: { argb: "FF0F172A" } },
      bottom: { style: "thin", color: { argb: "FF0F172A" } },
      right: { style: "thin", color: { argb: "FF0F172A" } },
    };
  });

  headerRow.height = 22;

  report.rows.forEach((row, rowIndex) => {
    const excelRow = sheet.getRow(headerRowNumber + 1 + rowIndex);

    report.columns.forEach((col, colIndex) => {
      const cell = excelRow.getCell(colIndex + 1);
      cell.value = String((row as Record<string, unknown>)[col.key] ?? "");
      cell.alignment = {
        vertical: "middle",
        horizontal:
          col.align === "right"
            ? "right"
            : col.align === "center"
            ? "center"
            : "left",
        wrapText: true,
      };
      cell.border = {
        top: { style: "thin", color: { argb: "FFE2E8F0" } },
        left: { style: "thin", color: { argb: "FFE2E8F0" } },
        bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
        right: { style: "thin", color: { argb: "FFE2E8F0" } },
      };

      if (rowIndex % 2 === 1) {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF8FAFC" },
        };
      }
    });
  });

  sheet.autoFilter = {
    from: `A${headerRowNumber}`,
    to: `${getColumnLetter(report.columns.length)}${headerRowNumber}`,
  };

  report.columns.forEach((col, index) => {
    const values = [
      col.label,
      ...report.rows.map((row) =>
        String((row as Record<string, unknown>)[col.key] ?? "")
      ),
    ];

    const max = values.reduce((acc, value) => Math.max(acc, value.length), 10);
    sheet.getColumn(index + 1).width = Math.min(Math.max(max + 3, 14), 32);
  });

  const buffer = await workbook.xlsx.writeBuffer();

  return new Response(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${report.tipo}.xlsx"`,
    },
  });
}