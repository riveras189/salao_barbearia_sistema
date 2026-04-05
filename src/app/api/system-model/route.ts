import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { registrarAuditoria } from "@/lib/auditoria";
import { usuarioTemPermissao } from "@/lib/authz";
import { normalizeSystemModel } from "@/lib/system-models";
import { ensureDefaultSystemModels } from "@/lib/system-models.server";
import { switchSystemModelSchema } from "@/schemas/system-model";

const prismaClient = prisma as any;

async function resolveCurrentModel(empresaId: string, usuarioId: string) {
  await ensureDefaultSystemModels();

  const [userPreference, companyPreference, defaultModel] = await Promise.all([
    prismaClient.usuarioSystemPreference.findUnique({
      where: { usuarioId },
      include: {
        model: true,
        changedBy: {
          select: { id: true, nome: true, login: true },
        },
      },
    }),
    prismaClient.empresaSystemPreference.findUnique({
      where: { empresaId },
      include: {
        model: true,
        changedBy: {
          select: { id: true, nome: true, login: true },
        },
      },
    }),
    prismaClient.systemModel.findFirst({
      where: { ativo: true, padrao: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  if (userPreference?.model) {
    return {
      scope: "user" as const,
      currentModelId: userPreference.modelId,
      currentModel: normalizeSystemModel(userPreference.model),
      lastChangedAt: userPreference.changedAt,
      changedBy: userPreference.changedBy,
    };
  }

  if (companyPreference?.model) {
    return {
      scope: "company" as const,
      currentModelId: companyPreference.modelId,
      currentModel: normalizeSystemModel(companyPreference.model),
      lastChangedAt: companyPreference.changedAt,
      changedBy: companyPreference.changedBy,
    };
  }

  const fallback = defaultModel ? normalizeSystemModel(defaultModel) : null;

  return {
    scope: "default" as const,
    currentModelId: fallback?.id ?? "barbearia_v1",
    currentModel: fallback,
    lastChangedAt: null,
    changedBy: null,
  };
}

export async function GET() {
  try {
    if (process.env.ENABLE_SYSTEM_MODEL_API === "false") {
      return NextResponse.json({ error: "Recurso desabilitado" }, { status: 404 });
    }

    const user = await getSessionUser();

    if (!user?.empresaId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const result = await resolveCurrentModel(user.empresaId, user.id);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Erro ao buscar modelo:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (process.env.ENABLE_SYSTEM_MODEL_API === "false") {
      return NextResponse.json({ error: "Recurso desabilitado" }, { status: 404 });
    }

    const user = await getSessionUser();

    if (!user?.empresaId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const hasPermission = await usuarioTemPermissao(user.id, "empresa.alterar_modelo");
    const isPrivileged = user.papelBase === "ADMIN" || user.papelBase === "GERENTE";

    if (!hasPermission && !isPrivileged) {
      return NextResponse.json(
        { error: "Apenas administradores e gerentes podem alterar o modelo" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validation = switchSystemModelSchema.safeParse(body);

    if (!validation.success) {
      const firstError = validation.error.issues[0]?.message || "Erro de validação";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { modelId, scope } = validation.data;

    await ensureDefaultSystemModels();

    const model = await prismaClient.systemModel.findFirst({
      where: {
        id: modelId,
        ativo: true,
        OR: [{ empresaId: null }, { empresaId: user.empresaId }],
      },
    });

    if (!model) {
      return NextResponse.json({ error: "Modelo não encontrado" }, { status: 404 });
    }

    const current = await resolveCurrentModel(user.empresaId, user.id);
    const previousModelId = current.currentModelId;

    if (scope === "company") {
      await prismaClient.empresaSystemPreference.upsert({
        where: { empresaId: user.empresaId },
        update: {
          modelId,
          changedById: user.id,
          changedAt: new Date(),
        },
        create: {
          empresaId: user.empresaId,
          modelId,
          changedById: user.id,
        },
      });
    } else {
      await prismaClient.usuarioSystemPreference.upsert({
        where: { usuarioId: user.id },
        update: {
          empresaId: user.empresaId,
          modelId,
          changedById: user.id,
          changedAt: new Date(),
        },
        create: {
          usuarioId: user.id,
          empresaId: user.empresaId,
          modelId,
          changedById: user.id,
        },
      });
    }

    await registrarAuditoria({
      empresaId: user.empresaId,
      usuarioId: user.id,
      acao: "ALTERAR_MODELO",
      modulo: "empresa",
      entidade: "system_model",
      entidadeId: modelId,
      descricao: `Modelo alterado de ${previousModelId} para ${modelId} no escopo ${scope}`,
    });

    const updated = await resolveCurrentModel(user.empresaId, user.id);

    return NextResponse.json({
      success: true,
      previousModelId,
      newModelId: modelId,
      scope,
      timestamp: new Date().toISOString(),
      currentModel: updated.currentModel,
    });
  } catch (error) {
    console.error("Erro ao trocar modelo:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
