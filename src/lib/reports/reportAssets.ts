import { readFile } from "fs/promises";
import path from "path";

export type ReportImageAsset = {
  bytes: Uint8Array;
  extension: "png" | "jpg";
};

export async function loadReportImage(
  url?: string | null
): Promise<ReportImageAsset | null> {
  if (!url) return null;

  try {
    if (!url.startsWith("/")) {
      return null;
    }

    const ext = path.extname(url).toLowerCase();

    if (ext !== ".png" && ext !== ".jpg" && ext !== ".jpeg") {
      return null;
    }

    const filePath = path.join(process.cwd(), "public", url.replace(/^\//, ""));
    const bytes = await readFile(filePath);

    return {
      bytes,
      extension: ext === ".png" ? "png" : "jpg",
    };
  } catch {
    return null;
  }
}