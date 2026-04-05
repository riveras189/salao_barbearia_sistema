import PageHeader from "@/components/layout/PageHeader";
import ServicoForm from "@/components/servicos/ServicoForm";
import { createServicoAction } from "@/actions/servicos";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export default async function NovoServicoPage() {
  const user = await requireUser();

  const profissionais = await prisma.profissional.findMany({
    where: {
      empresaId: user.empresaId,
    },
    orderBy: { nome: "asc" },
    select: {
      id: true,
      nome: true,
      ativo: true,
    },
  });

  return (
    <div>
      <PageHeader
        title="Novo serviço"
        description="Cadastre um novo serviço no sistema."
      />

      <ServicoForm
        mode="create"
        action={createServicoAction}
        profissionais={profissionais}
      />
    </div>
  );
}