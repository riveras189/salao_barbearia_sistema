import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import PageHeader from "@/components/layout/PageHeader";
import ProfissionalServicosForm from "@/components/profissionais/ProfissionalServicosForm";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    ok?: string;
  }>;
};

export default async function ProfissionalServicosPage({
  params,
  searchParams,
}: PageProps) {
  const user = await requireUser();
  const { id } = await params;
  const sp = (await searchParams) || {};

  const profissional = await prisma.profissional.findFirst({
    where: {
      id,
      empresaId: user.empresaId,
    },
    include: {
      servicos: true,
    },
  });

  if (!profissional) notFound();

  const servicos = await prisma.servico.findMany({
    where: {
      empresaId: user.empresaId,
    },
    orderBy: { nome: "asc" },
    select: {
      id: true,
      nome: true,
      preco: true,
      duracaoMin: true,
      ativo: true,
    },
  });

  return (
    <div>
      <PageHeader
        title="Serviços do profissional"
        description={`Defina os serviços que ${profissional.nome} pode executar.`}
        actions={
          <Link
            href={`/profissionais/${profissional.id}`}
            className="inline-flex items-center justify-center rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Voltar
          </Link>
        }
      />

      {String(sp.ok || "") === "1" ? (
        <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Serviços salvos com sucesso.
        </div>
      ) : null}

      <ProfissionalServicosForm
        profissionalId={profissional.id}
        servicos={servicos.map((item) => ({
          id: item.id,
          nome: item.nome,
          preco: item.preco.toString(),
          duracaoMin: item.duracaoMin,
          ativo: item.ativo,
        }))}
        selectedIds={profissional.servicos.map((item) => item.servicoId)}
      />
    </div>
  );
}