import { notFound } from "next/navigation";
import PageHeader from "@/components/layout/PageHeader";
import PanelBackButton from "@/components/PanelBackButton";
import UsuarioForm from "@/components/usuarios/UsuarioForm";
import { updateUsuarioAction } from "@/actions/usuarios";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditarUsuarioPage({ params }: PageProps) {
  const user = await requireUser();
  const { id } = await params;

  const usuario = await prisma.usuario.findFirst({
    where: {
      id,
      empresaId: user.empresaId,
    },
    select: {
      id: true,
      nome: true,
      email: true,
      login: true,
      papelBase: true,
      funcionarioId: true,
      profissionalId: true,
      ativo: true,
    },
  });

  if (!usuario) notFound();

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
        title="Editar usuário"
        description={`Atualize os dados de ${usuario.nome}.`}
      />

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <UsuarioForm
          action={updateUsuarioAction.bind(null, usuario.id)}
          funcionarios={funcionarios}
          profissionais={profissionais}
        />
      </div>
    </div>
  );
}