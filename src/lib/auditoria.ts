import { prisma } from "@/lib/prisma";

type RegistrarAuditoriaParams = {
  empresaId: string;
  usuarioId?: string | null;
  acao: string;
  modulo: string;
  entidade: string;
  entidadeId: string;
  descricao?: string | null;
};

export async function registrarAuditoria(params: RegistrarAuditoriaParams) {
  await prisma.auditoriaLog.create({
    data: {
      empresaId: params.empresaId,
      usuarioId: params.usuarioId ?? undefined,
      acao: params.acao,
      entidade: params.entidade,
      entidadeId: params.entidadeId,
      descricao: params.descricao ?? undefined,
      dadosDepois: params.modulo
        ? {
          modulo: params.modulo,
        }
        : undefined,
    },
  });
}
