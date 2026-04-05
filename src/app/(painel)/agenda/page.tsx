import Link from "next/link";
import { prisma } from "@/lib/prisma";
import AgendaAutoRefresh from "@/components/agenda/AgendaAutoRefresh";
import { requireUser } from "@/lib/auth";
import {
  endOfDay,
  formatDateBR,
  startOfDay,
  todayYMD,
  getCurrentTimeForTimezone,
} from "@/lib/agenda";
import PageHeader from "@/components/layout/PageHeader";
import AgendaDayGrid from "@/components/agenda/AgendaDayGrid";
import AgendamentoForm from "@/components/agenda/AgendamentoForm";
import BloqueioAgendaForm from "@/components/agenda/BloqueioAgendaForm";
import {
  createAgendamentoAction,
  createBloqueioAgendaAction,
} from "@/actions/agenda";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = {
  searchParams?: Promise<{
    dia?: string;
    profissionalId?: string;
    hora?: string;
    novo?: string;
    bloqueio?: string;
    ok?: string;
  }>;
};

function shiftDay(ymd: string, offset: number) {
  const date = new Date(`${ymd}T12:00:00`);
  date.setDate(date.getDate() + offset);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function buildAgendaHref({
  dia,
  profissionalId,
  hora,
  novo,
  bloqueio,
}: {
  dia: string;
  profissionalId?: string;
  hora?: string;
  novo?: boolean;
  bloqueio?: boolean;
}) {
  const params = new URLSearchParams();

  if (dia) params.set("dia", dia);
  if (profissionalId) params.set("profissionalId", profissionalId);
  if (hora) params.set("hora", hora);
  if (novo) params.set("novo", "1");
  if (bloqueio) params.set("bloqueio", "1");

  return `/agenda?${params.toString()}`;
}

export default async function AgendaPage({ searchParams }: PageProps) {
  const user = await requireUser();
  const params = (await searchParams) || {};

  const dia = String(params.dia || todayYMD()).trim();
  const profissionalId = String(params.profissionalId || "").trim();
  const hora = String(params.hora || "").trim();
  const showNovo = String(params.novo || "") === "1";
  const showBloqueio = String(params.bloqueio || "") === "1";
  const ok = String(params.ok || "").trim();

  const empresa = await prisma.empresa.findUnique({
    where: { id: user.empresaId },
    select: {
      configuracao: {
        select: {
          intervaloAgendaMin: true,
        },
      },
    },
  });

  const intervalMinutes = empresa?.configuracao?.intervaloAgendaMin || 30;

  const profissionais = await prisma.profissional.findMany({
    where: {
      empresaId: user.empresaId,
      ativo: true,
    },
    orderBy: { nome: "asc" },
    select: {
      id: true,
      nome: true,
      corAgenda: true,
      fotoUrl: true,
    },
  });

  const visibleProfissionais = profissionalId
    ? profissionais.filter((item) => item.id === profissionalId)
    : profissionais;

  const dayStart = startOfDay(dia);
  const dayEnd = endOfDay(dia);

  const [agendamentos, bloqueios, clientes, servicos] = await Promise.all([
    prisma.agendamento.findMany({
      where: {
        empresaId: user.empresaId,
        profissionalId: { in: visibleProfissionais.map((item) => item.id) },
        inicio: { lt: dayEnd },
        fim: { gt: dayStart },
      },
      include: {
        cliente: {
          select: {
            nome: true,
            fotoUrl: true,
          },
        },
        profissional: {
          select: {
            nome: true,
            fotoUrl: true,
            corAgenda: true,
          },
        },
        servicos: {
          orderBy: { ordem: "asc" },
          select: { nomeSnapshot: true },
        },
      },
      orderBy: { inicio: "asc" },
    }),
    prisma.bloqueioAgenda.findMany({
      where: {
        empresaId: user.empresaId,
        profissionalId: { in: visibleProfissionais.map((item) => item.id) },
        ativo: true,
        dataInicio: { lt: dayEnd },
        dataFim: { gt: dayStart },
      },
      orderBy: { dataInicio: "asc" },
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

  const prevDia = shiftDay(dia, -1);
  const nextDia = shiftDay(dia, 1);

  const baseAgendaHref = buildAgendaHref({
    dia,
    profissionalId,
  });

  const novoAgendamentoHref = buildAgendaHref({
    dia,
    profissionalId,
    hora,
    novo: true,
  });

  const novoBloqueioHref = buildAgendaHref({
    dia,
    profissionalId,
    bloqueio: true,
  });
const pauseAutoRefresh = showNovo || showBloqueio;

return (
  <div>
    {!pauseAutoRefresh ? (
      <AgendaAutoRefresh intervalMs={10000} />
    ) : null}

      <PageHeader
        title="Agenda"
        description={`Agenda do dia ${formatDateBR(dia)} - ${getCurrentTimeForTimezone()}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/agenda?dia=${prevDia}`}
              className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Dia anterior
            </Link>

            <Link
              href={`/agenda?dia=${todayYMD()}`}
              className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Hoje
            </Link>

            <Link
              href={`/agenda?dia=${nextDia}`}
              className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Próximo dia
            </Link>

            {showNovo ? (
              <Link
                href={baseAgendaHref}
                className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Fechar agendamento
              </Link>
            ) : (
              <Link
                href={novoAgendamentoHref}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              >
                Novo agendamento
              </Link>
            )}

            {showBloqueio ? (
              <Link
                href={baseAgendaHref}
                className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Fechar bloqueio
              </Link>
            ) : (
              <Link
                href={novoBloqueioHref}
                className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Novo bloqueio
              </Link>
            )}
          </div>
        }
      />

      {ok === "created" ? (
        <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Agendamento criado com sucesso.
        </div>
      ) : null}

      {ok === "updated" ? (
        <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Agendamento atualizado com sucesso.
        </div>
      ) : null}

      {ok === "blocked" ? (
        <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Bloqueio salvo com sucesso.
        </div>
      ) : null}

      <form
        method="get"
        className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <div className="grid gap-3 md:grid-cols-[180px_1fr_auto]">
          <input
            type="date"
            name="dia"
            defaultValue={dia}
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-900"
          />

          <select
            name="profissionalId"
            defaultValue={profissionalId}
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-900"
          >
            <option value="">Todos os profissionais</option>
            {profissionais.map((profissional) => (
              <option key={profissional.id} value={profissional.id}>
                {profissional.nome}
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Atualizar
          </button>
        </div>
      </form>

      <div className="mb-6 flex flex-wrap gap-3 text-xs">
        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-2 font-semibold text-emerald-800">
          <span className="h-3 w-3 rounded-full bg-emerald-500" />
          Agendado
        </span>
        <span className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-2 font-semibold text-blue-800">
          <span className="h-3 w-3 rounded-full bg-blue-500" />
          Confirmado
        </span>
        <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-2 font-semibold text-amber-800">
          <span className="h-3 w-3 rounded-full bg-amber-500" />
          Em atendimento
        </span>
        <span className="inline-flex items-center gap-2 rounded-full bg-sky-100 px-3 py-2 font-semibold text-sky-800">
          <span className="h-3 w-3 rounded-full bg-sky-500" />
          Concluído
        </span>
        <span className="inline-flex items-center gap-2 rounded-full bg-red-100 px-3 py-2 font-semibold text-red-800">
          <span className="h-3 w-3 rounded-full bg-red-500" />
          Cancelado
        </span>
        <span className="inline-flex items-center gap-2 rounded-full bg-purple-100 px-3 py-2 font-semibold text-purple-800">
          <span className="h-3 w-3 rounded-full bg-purple-500" />
          Encaixe
        </span>
        <span className="inline-flex items-center gap-2 rounded-full bg-rose-100 px-3 py-2 font-semibold text-rose-800">
          <span className="h-3 w-3 rounded-full bg-rose-400" />
          Bloqueio
        </span>
      </div>

      {showNovo ? (
        <div className="mb-6">
          <AgendamentoForm
            mode="create"
            action={createAgendamentoAction}
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
              data: dia,
              horaInicio: hora || "",
              profissionalId,
              servicoIds: [],
            }}
          />
        </div>
      ) : null}

      {showBloqueio ? (
        <div className="mb-6">
          <BloqueioAgendaForm
            mode="create"
            action={createBloqueioAgendaAction}
            cancelHref={baseAgendaHref}
            profissionais={profissionais.map((item) => ({
              id: item.id,
              nome: item.nome,
            }))}
            initialValues={{
              data: dia,
              profissionalId,
            }}
          />
        </div>
      ) : null}

      <AgendaDayGrid
        dia={dia}
        profissionais={visibleProfissionais}
        agendamentos={agendamentos.map((item) => ({
          id: item.id,
          profissionalId: item.profissionalId,
          clienteNome: item.cliente?.nome || "Cliente",
          clienteFotoUrl: item.cliente?.fotoUrl || "",
          profissionalNome: item.profissional?.nome || "",
          profissionalFotoUrl: item.profissional?.fotoUrl || "",
          inicio: item.inicio,
          fim: item.fim,
          status: item.status,
          encaixe: item.encaixe,
          observacoes: item.observacoes,
          servicos: item.servicos.map((s) => ({
            nomeSnapshot: s.nomeSnapshot,
          })),
        }))}
        bloqueios={bloqueios.map((item) => ({
          id: item.id,
          profissionalId: item.profissionalId,
          dataInicio: item.dataInicio,
          dataFim: item.dataFim,
          tipo: item.tipo,
          descricao: item.descricao,
          cor: item.cor,
        }))}
        intervalMinutes={intervalMinutes}
      />
    </div>
  );
}