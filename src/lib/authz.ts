import { prisma } from "@/lib/prisma";
import { PERFIS_BASE } from "@/lib/permissoes";
import type { PapelBaseUsuario } from "@prisma/client";

function getPermissoesBase(papelBase: PapelBaseUsuario | null | undefined) {
  if (!papelBase) return [];
  return PERFIS_BASE[papelBase] ?? [];
}

export async function usuarioTemPermissao(usuarioId: string, codigo: string) {
  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    include: {
      permissoes: {
        include: {
          permissao: true,
        },
      },
    },
  });

  if (!usuario || !usuario.ativo) return false;

  const base = getPermissoesBase(usuario.papelBase);

  if (base.includes("*") || base.includes(codigo)) {
    return true;
  }

  const override = usuario.permissoes.find(
    (item) => item.permissao?.codigo === codigo
  );

  return override?.permitido === true;
}

export async function exigirPermissao(usuarioId: string, codigo: string) {
  const ok = await usuarioTemPermissao(usuarioId, codigo);

  if (!ok) {
    throw new Error("Você não tem permissão para executar esta ação.");
  }
}