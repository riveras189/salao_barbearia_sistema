import { mkdir, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

function getExtension(type: string) {
  switch (type) {
    case "image/jpeg":
    case "image/jpg":
      return ".jpg";
    case "image/png":
      return ".png";
    case "image/webp":
      return ".webp";
    default:
      return "";
  }
}

export async function saveProdutoImage(file: File): Promise<
  | { ok: true; url: string }
  | { ok: false; error: string }
> {
  if (!file || file.size <= 0) {
    return { ok: false, error: "Nenhuma imagem foi enviada." };
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return {
      ok: false,
      error: "Imagem não suportada. Use JPG, PNG ou WEBP.",
    };
  }

  if (file.size > 5 * 1024 * 1024) {
    return {
      ok: false,
      error: "A imagem deve ter no máximo 5MB.",
    };
  }

  const ext = getExtension(file.type);
  if (!ext) {
    return {
      ok: false,
      error: "Não foi possível identificar o tipo da imagem.",
    };
  }

  const dir = path.join(process.cwd(), "public", "uploads", "produtos");
  await mkdir(dir, { recursive: true });

  const fileName = `${Date.now()}-${crypto.randomUUID()}${ext}`;
  const filePath = path.join(dir, fileName);

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  return {
    ok: true,
    url: `/uploads/produtos/${fileName}`,
  };
}