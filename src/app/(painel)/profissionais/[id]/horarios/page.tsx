import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import PageHeader from "@/components/layout/PageHeader";
import ProfissionalHorariosForm from "@/components/profissionais/ProfissionalHorariosForm";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    ok?: string;
  }>;
};

export default async function ProfissionalHorariosPage({
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
      horarios: {
        orderBy: [{ diaSemana: "asc" }],
      },
    },
  });

  if (!profissional) notFound();

  return (
    <div>
      <PageHeader
        title="Horários do profissional"
        description={`Defina a escala semanal de ${profissional.nome}.`}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href={`/profissionais/${profissional.id}`}
              className="inline-flex items-center justify-center rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Voltar
            </Link>
          </div>
        }
      />

      {String(sp.ok || "") === "1" ? (
        <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Horários salvos com sucesso.
        </div>
      ) : null}

      <ProfissionalHorariosForm
        profissionalId={profissional.id}
        horarios={profissional.horarios.map((item) => ({
          diaSemana: item.diaSemana,
          horaInicio: item.horaInicio,
          horaFim: item.horaFim,
          intervaloInicio: item.intervaloInicio,
          intervaloFim: item.intervaloFim,
          ativo: item.ativo,
        }))}
      />
    </div>
  );
}