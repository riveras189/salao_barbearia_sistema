import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import PageHeader from "@/components/layout/PageHeader";
import BloqueioAgendaForm from "@/components/agenda/BloqueioAgendaForm";
import { updateBloqueioAgendaAction } from "@/actions/agenda";
import { formatDateBR, formatTime, ymdFromDate } from "@/lib/agenda";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditarBloqueioPage({ params }: PageProps) {
  const user = await requireUser();
  const { id } = await params;

  const [bloqueio, profissionais] = await Promise.all([
    prisma.bloqueioAgenda.findFirst({
      where: {
        id,
        empresaId: user.empresaId,
      },
      include: {
        profissional: true,
      },
    }),
    prisma.profissional.findMany({
      where: {
        empresaId: user.empresaId,
        ativo: true,
      },
      orderBy: { nome: "asc" },
      select: {
        id: true,
        nome: true,
      },
    }),
  ]);

  if (!bloqueio) notFound();

  const dia = ymdFromDate(bloqueio.dataInicio);

  return (
    <div>
      <PageHeader
        title="Editar bloqueio"
        description={`${bloqueio.profissional.nome} • ${formatDateBR(
          bloqueio.dataInicio
        )} • ${formatTime(bloqueio.dataInicio)} às ${formatTime(bloqueio.dataFim)}`}
        actions={
          <Link
            href={`/agenda?dia=${dia}`}
            className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Voltar para agenda
          </Link>
        }
      />

      <BloqueioAgendaForm
        mode="edit"
        action={updateBloqueioAgendaAction}
        bloqueioId={bloqueio.id}
        cancelHref={`/agenda?dia=${dia}`}
        profissionais={profissionais}
        initialValues={{
          profissionalId: bloqueio.profissionalId,
          data: ymdFromDate(bloqueio.dataInicio),
          horaInicio: formatTime(bloqueio.dataInicio),
          horaFim: formatTime(bloqueio.dataFim),
          tipo: bloqueio.tipo,
          descricao: bloqueio.descricao || "",
          cor: bloqueio.cor || "#fecaca",
          recorrente: bloqueio.recorrente,
        }}
      />
    </div>
  );
}