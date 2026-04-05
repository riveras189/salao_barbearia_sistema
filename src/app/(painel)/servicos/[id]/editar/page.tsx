import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import PageHeader from "@/components/layout/PageHeader";
import ServicoForm from "@/components/servicos/ServicoForm";
import { updateServicoAction } from "@/actions/servicos";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditarServicoPage({ params }: PageProps) {
  const user = await requireUser();
  const { id } = await params;

  const servico = await prisma.servico.findFirst({
    where: {
      id,
      empresaId: user.empresaId,
    },
    include: {
      categoria: true,
      profissionais: true,
    },
  });

  if (!servico) notFound();

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
        title="Editar serviço"
        description={`Atualize os dados de ${servico.nome}.`}
      />

      <ServicoForm
        mode="edit"
        action={updateServicoAction}
        servicoId={servico.id}
        cancelHref={`/servicos/${servico.id}`}
        profissionais={profissionais}
        initialValues={{
          nome: servico.nome || "",
          descricao: servico.descricao || "",
          duracaoMin: String(servico.duracaoMin || 30),
          preco: servico.preco.toString(),
          comissaoPercentualPadrao: servico.comissaoPercentualPadrao.toString(),
          categoriaNome: servico.categoria?.nome || "",
          exibirNoSite: servico.exibirNoSite,
          profissionalIds: servico.profissionais.map((item) => item.profissionalId),
        }}
      />
    </div>
  );
}