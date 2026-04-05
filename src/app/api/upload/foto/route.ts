import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_FOLDERS = new Set([
  "clientes",
  "profissionais",
  "funcionarios",
  "produtos",
  "banners",
  "galeria",
]);

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function sanitizeBaseName(filename: string) {
  const semExt = filename.replace(/\.[^.]+$/, "");

  const cleaned = semExt
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-_]+|[-_]+$/g, "")
    .toLowerCase();

  return cleaned || "imagem";
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const fileEntry = formData.get("file");
    const folder = String(formData.get("folder") || "")
      .trim()
      .toLowerCase();

    if (!folder || !ALLOWED_FOLDERS.has(folder)) {
      return NextResponse.json(
        { ok: false, error: "Pasta de upload inválida." },
        { status: 400 },
      );
    }

    if (!(fileEntry instanceof File)) {
      return NextResponse.json(
        { ok: false, error: "Arquivo não enviado." },
        { status: 400 },
      );
    }

    if (!fileEntry.size) {
      return NextResponse.json(
        { ok: false, error: "Arquivo vazio." },
        { status: 400 },
      );
    }

    if (fileEntry.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { ok: false, error: "A imagem é muito grande. Máximo permitido: 5MB." },
        { status: 400 },
      );
    }

    const mimeType = String(fileEntry.type || "").toLowerCase();
    const ext = MIME_TO_EXT[mimeType];

    if (!ext) {
      return NextResponse.json(
        { ok: false, error: "Formato não suportado. Use JPG, PNG ou WEBP." },
        { status: 400 },
      );
    }

    const bytes = await fileEntry.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const baseName = sanitizeBaseName(fileEntry.name || "imagem");
    const fileName = `${Date.now()}-${randomUUID()}-${baseName}.${ext}`;

    const uploadDir = path.join(process.cwd(), "public", "uploads", folder);
    const filePath = path.join(uploadDir, fileName);

    await mkdir(uploadDir, { recursive: true });
    await writeFile(filePath, buffer);

    const url = `/uploads/${folder}/${fileName}`;

    return NextResponse.json({
      ok: true,
      url,
      fileName,
      folder,
      mimeType,
      size: fileEntry.size,
    });
  } catch (error) {
    console.error("Erro no upload de foto:", error);

    return NextResponse.json(
      { ok: false, error: "Não foi possível enviar a imagem." },
      { status: 500 },
    );
  }
}