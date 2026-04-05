import { prisma } from "@/lib/prisma";
import { DEFAULT_SYSTEM_MODELS } from "@/lib/system-models";

const prismaClient = prisma as any;

export async function ensureDefaultSystemModels() {
  await prisma.$transaction(
    DEFAULT_SYSTEM_MODELS.map((model) =>
      prismaClient.systemModel.upsert({
        where: { id: model.id },
        update: {
          nome: model.name,
          descricao: model.description,
          icone: model.icon,
          ativo: true,
          padrao: Boolean(model.isDefault),
          configuracoes: model.settings,
        },
        create: {
          id: model.id,
          nome: model.name,
          descricao: model.description,
          icone: model.icon,
          ativo: true,
          padrao: Boolean(model.isDefault),
          configuracoes: model.settings,
        },
      })
    )
  );
}
