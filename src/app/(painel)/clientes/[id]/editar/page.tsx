import { notFound } from "next/navigation";
import PageHeader from "@/components/layout/PageHeader";
import ClienteForm from "@/components/clientes/ClienteForm";
import { updateClienteAction } from "@/actions/clientes";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditarClientePage({ params }: PageProps) {
  const user = await requireUser();
  const { id } = await params;

  const cliente = await prisma.cliente.findFirst({
    where: {
      id,
      empresaId: user.empresaId,
    },
    select: {
      id: true,
      nome: true,
      cpf: true,
      telefone: true,
      whatsapp: true,
      email: true,
      fotoUrl: true,
      dataNascimento: true,
      cep: true,
      logradouro: true,
      numero: true,
      complemento: true,
      bairro: true,
      cidade: true,
      uf: true,
      observacoes: true,
      ativo: true,
    },
  });

  if (!cliente) {
    notFound();
  }

  return (
    <div>
      <PageHeader
        title="Editar cliente"
        description="Atualize os dados do cliente."
      />

      <ClienteForm
        key={cliente.id}
        mode="edit"
        action={updateClienteAction}
        cliente={cliente}
      />
    </div>
  );
}