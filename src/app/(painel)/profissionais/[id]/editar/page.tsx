import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import PageHeader from "@/components/layout/PageHeader";
import ProfissionalForm from "@/components/profissionais/ProfissionalForm";
import { updateProfissionalAction } from "@/actions/profissionais";
import { toInputDate } from "@/schemas/profissional";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditarProfissionalPage({ params }: PageProps) {
  const user = await requireUser();
  const { id } = await params;

  const profissional = await prisma.profissional.findFirst({
    where: {
      id,
      empresaId: user.empresaId,
    },
  });

  if (!profissional) notFound();

  return (
    <div>
      <PageHeader
        title="Editar profissional"
        description={`Atualize os dados de ${profissional.nome}.`}
      />

      <ProfissionalForm
        mode="edit"
        action={updateProfissionalAction}
        profissionalId={profissional.id}
        cancelHref={`/profissionais/${profissional.id}`}
        initialValues={{
          nome: profissional.nome || "",
          cpf: profissional.cpf || "",
          cnpj: profissional.cnpj || "",
          email: profissional.email || "",
          telefone: profissional.telefone || "",
          whatsapp: profissional.whatsapp || "",
          cep: profissional.cep || "",
          logradouro: profissional.logradouro || "",
          numero: profissional.numero || "",
          complemento: profissional.complemento || "",
          bairro: profissional.bairro || "",
          cidade: profissional.cidade || "",
          uf: profissional.uf || "",
          dataAdmissao: toInputDate(profissional.dataAdmissao),
          dataDemissao: toInputDate(profissional.dataDemissao),
          observacoes: profissional.observacoes || "",
          corAgenda: profissional.corAgenda || "#1d4ed8",
        }}
      />
    </div>
  );
}