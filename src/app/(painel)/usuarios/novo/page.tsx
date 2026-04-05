import PageHeader from "@/components/layout/PageHeader";
import PanelBackButton from "@/components/PanelBackButton";
import UsuarioForm from "@/components/usuarios/UsuarioForm";
import { createUsuarioAction } from "@/actions/usuarios";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export default async function NovoUsuarioPage() {
  const user = await requireUser();

  const funcionarios = await prisma.funcionario.findMany({
    where: {
      empresaId: user.empresaId,
      ativo: true,
    },
    orderBy: {
      nome: "asc",
    },
    select: {
      id: true,
      nome: true,
    },
  });

  const profissionais = await prisma.profissional.findMany({
    where: {
      empresaId: user.empresaId,
      ativo: true,
    },
    orderBy: {
      nome: "asc",
    },
    select: {
      id: true,
      nome: true,
    },
  });

  return (
    <div className="space-y-6">
      <PanelBackButton />

      <PageHeader
        title="Novo usuário"
        description="Cadastre um novo usuário."
      />

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <UsuarioForm
          action={createUsuarioAction}
          funcionarios={funcionarios}
          profissionais={profissionais}
        />
      </div>
    </div>
  );
}