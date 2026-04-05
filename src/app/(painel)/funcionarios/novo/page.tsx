import PageHeader from "@/components/layout/PageHeader";
import FuncionarioForm from "@/components/funcionarios/FuncionarioForm";
import { createFuncionarioAction } from "@/actions/funcionarios";
import { requireUser } from "@/lib/auth";

export default async function NovoFuncionarioPage() {
  await requireUser();

  return (
    <div>
      <PageHeader
        title="Novo funcionário"
        description="Cadastre um novo funcionário no sistema."
      />

      <FuncionarioForm mode="create" action={createFuncionarioAction} />
    </div>
  );
}