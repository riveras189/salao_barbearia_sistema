import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEFAULT_SYSTEM_MODELS, normalizeSystemModel } from "@/lib/system-models";
import { ensureDefaultSystemModels } from "@/lib/system-models.server";

const prismaClient = prisma as any;

export async function GET() {
  try {
    if (process.env.ENABLE_SYSTEM_MODEL_API === "false") {
      return NextResponse.json({ models: [] }, { status: 404 });
    }

    await ensureDefaultSystemModels();

    const models = await prismaClient.systemModel.findMany({
      where: { ativo: true },
      orderBy: [{ padrao: "desc" }, { nome: "asc" }],
    });

    return NextResponse.json({
      models: models.map((model: any) => normalizeSystemModel(model)),
    });
  } catch (error) {
    console.error("Erro ao listar modelos:", error);

    return NextResponse.json({
      models: DEFAULT_SYSTEM_MODELS,
      degraded: true,
    });
  }
}
