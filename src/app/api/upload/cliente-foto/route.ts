import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/jpg",
]);

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return Response.json(
        { ok: false, error: "Arquivo não enviado." },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return Response.json(
        {
          ok: false,
          error: "Formato não suportado. Envie JPG, PNG ou WEBP.",
        },
        { status: 400 }
      );
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return Response.json(
        {
          ok: false,
          error: "A imagem é muito grande. Máximo permitido: 5MB.",
        },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext =
      path.extname(file.name || "").toLowerCase() ||
      (file.type === "image/png"
        ? ".png"
        : file.type === "image/webp"
        ? ".webp"
        : ".jpg");

    const safeExt = [".jpg", ".jpeg", ".png", ".webp"].includes(ext)
      ? ext
      : ".jpg";

    const fileName = `${randomUUID()}${safeExt}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", "clientes");

    await mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, fileName);
    await writeFile(filePath, buffer);

    const url = `/uploads/clientes/${fileName}`;

    return Response.json({
      ok: true,
      url,
    });
  } catch (error) {
    console.error("Erro ao fazer upload da foto do cliente:", error);

    return Response.json(
      { ok: false, error: "Não foi possível fazer upload da imagem." },
      { status: 500 }
    );
  }
}