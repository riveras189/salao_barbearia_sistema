import PageHeader from "@/components/layout/PageHeader";
import ClienteForm from "@/components/clientes/ClienteForm";
import { createClienteAction } from "@/actions/clientes";
import { requireUser } from "@/lib/auth";

export default async function NovoClientePage() {
  await requireUser();

  return (
    <div>
      <PageHeader
        title="Novo cliente"
        description="Cadastre um novo cliente no sistema."
      />

      <ClienteForm mode="create" action={createClienteAction} />
    </div>
  );
}