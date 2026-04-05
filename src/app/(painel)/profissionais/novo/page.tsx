import PageHeader from "@/components/layout/PageHeader";
import ProfissionalForm from "@/components/profissionais/ProfissionalForm";
import { createProfissionalAction } from "@/actions/profissionais";
import { requireUser } from "@/lib/auth";

export default async function NovoProfissionalPage() {
  await requireUser();

  return (
    <div>
      <PageHeader
        title="Novo profissional"
        description="Cadastre um novo profissional no sistema."
      />

      <ProfissionalForm mode="create" action={createProfissionalAction} />
    </div>
  );
}