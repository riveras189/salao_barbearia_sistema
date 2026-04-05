import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusAgendamento } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import PageHeader from "@/components/layout/PageHeader";
import AgendamentoForm from "@/components/agenda/AgendamentoForm";
import { setAgendamentoStatusAction, updateAgendamentoAction } from "@/actions/agenda";
import { formatDateBR, formatTime, ymdFromDate } from "@/lib/agenda";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditarAgendamentoPage({ params }: PageProps) {
  const user = await requireUser();
  const { id } = await params;

  const [agendamento, clientes, profissionais, servicos] = await Promise.all([
    prisma.agendamento.findFirst({
      where: {
        id,
        empresaId: user.empresaId,
      },
      include: {
        cliente: true,
        profissional: true,
        servicos: {
          orderBy: { ordem: "asc" },
        },
      },
    }),
    prisma.cliente.findMany({
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
    prisma.profissional.findMany({
      where: {
        empresaId: user.empresaId,
        ativo: true,
      },
      orderBy: { nome: "asc" },
      select: {
        id: true,
        nome: true,
        corAgenda: true,
      },
    }),
    prisma.servico.findMany({
      where: {
        empresaId: user.empresaId,
        ativo: true,
      },
      orderBy: { nome: "asc" },
      select: {
        id: true,
        nome: true,
        duracaoMin: true,
        preco: true,
      },
    }),
  ]);

  if (!agendamento) notFound();

  const dia = ymdFromDate(agendamento.inicio);

  return (
    <div>
      <PageHeader
        title="Editar agendamento"
        description={`${agendamento.cliente?.nome || "Cliente"} • ${formatDateBR(
          agendamento.inicio
        )} às ${formatTime(agendamento.inicio)}`}
        actions={
          <Link
            href={`/agenda?dia=${dia}`}
            className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Voltar para agenda
          </Link>
        }
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {agendamento.status !== StatusAgendamento.CONFIRMADO ? (
          <form action={setAgendamentoStatusAction}>
            <input type="hidden" name="id" value={agendamento.id} />
            <input type="hidden" name="dia" value={dia} />
            <input type="hidden" name="status" value={StatusAgendamento.CONFIRMADO} />
            <button
              type="submit"
              className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Confirmar
            </button>
          </form>
        ) : null}

        {agendamento.status !== StatusAgendamento.CONCLUIDO ? (
          <form action={setAgendamentoStatusAction}>
            <input type="hidden" name="id" value={agendamento.id} />
            <input type="hidden" name="dia" value={dia} />
            <input type="hidden" name="status" value={StatusAgendamento.CONCLUIDO} />
            <button
              type="submit"
              className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Concluir
            </button>
          </form>
        ) : null}

        {agendamento.status !== StatusAgendamento.CANCELADO ? (
          <form action={setAgendamentoStatusAction}>
            <input type="hidden" name="id" value={agendamento.id} />
            <input type="hidden" name="dia" value={dia} />
            <input type="hidden" name="status" value={StatusAgendamento.CANCELADO} />
            <button
              type="submit"
              className="rounded-2xl border border-red-300 px-4 py-3 text-sm font-semibold text-red-700 hover:bg-red-50"
            >
              Cancelar
            </button>
          </form>
        ) : null}
      </div>

      <AgendamentoForm
        mode="edit"
        action={updateAgendamentoAction}
        agendamentoId={agendamento.id}
        cancelHref={`/agenda?dia=${dia}`}
        clientes={clientes}
        profissionais={profissionais}
        servicos={servicos.map((item) => ({
          id: item.id,
          nome: item.nome,
          duracaoMin: item.duracaoMin,
          preco: item.preco.toString(),
        }))}
        initialValues={{
          clienteId: agendamento.clienteId,
          profissionalId: agendamento.profissionalId,
          data: ymdFromDate(agendamento.inicio),
          horaInicio: formatTime(agendamento.inicio),
          servicoIds: agendamento.servicos.map((item) => item.servicoId),
          observacoes: agendamento.observacoes || "",
          encaixe: agendamento.encaixe,
        }}
      />
    </div>
  );
}