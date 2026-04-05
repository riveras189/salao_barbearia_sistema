import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import PageHeader from "@/components/layout/PageHeader";
import FuncionarioForm from "@/components/funcionarios/FuncionarioForm";
import { updateFuncionarioAction } from "@/actions/funcionarios";
import { toInputDate } from "@/schemas/funcionario";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditarFuncionarioPage({ params }: PageProps) {
  const user = await requireUser();
  const { id } = await params;

  const funcionario = await prisma.funcionario.findFirst({
    where: {
      id,
      empresaId: user.empresaId,
    },
  });

  if (!funcionario) notFound();

  return (
    <div>
      <PageHeader
        title="Editar funcionário"
        description={`Atualize os dados de ${funcionario.nome}.`}
      />

      <FuncionarioForm
        mode="edit"
        action={updateFuncionarioAction}
        funcionarioId={funcionario.id}
        cancelHref={`/funcionarios/${funcionario.id}`}
        initialValues={{
          nome: funcionario.nome || "",
          cpf: funcionario.cpf || "",
          email: funcionario.email || "",
          telefone: funcionario.telefone || "",
          whatsapp: funcionario.whatsapp || "",
          fotoUrl: funcionario.fotoUrl || "",
          cep: funcionario.cep || "",
          logradouro: funcionario.logradouro || "",
          numero: funcionario.numero || "",
          complemento: funcionario.complemento || "",
          bairro: funcionario.bairro || "",
          cidade: funcionario.cidade || "",
          uf: funcionario.uf || "",
          dataAdmissao: toInputDate(funcionario.dataAdmissao),
          dataDemissao: toInputDate(funcionario.dataDemissao),
          observacoes: funcionario.observacoes || "",
        }}
      />
    </div>
  );
}