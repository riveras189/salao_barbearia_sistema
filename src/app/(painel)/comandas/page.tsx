import Link from "next/link";
import PageHeader from "@/components/layout/PageHeader";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

type PageProps = {
  searchParams?: Promise<{
    q?: string;
    status?: string;
  }>;
};

function money(value: number | string | null | undefined) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatDateTime(value?: Date | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function statusBadge(status: string) {
  switch (status) {
    case "ABERTA":
      return "bg-emerald-100 text-emerald-700";
    case "EM_ANDAMENTO":
      return "bg-amber-100 text-amber-700";
    case "FECHADA":
      return "bg-sky-100 text-sky-700";
    case "CANCELADA":
      return "bg-red-100 text-red-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

export default async function ComandasPage({ searchParams }: PageProps) {
  const user = await requireUser();
  const params = (await searchParams) ?? {};

  const q = String(params.q ?? "").trim();
  const status = String(params.status ?? "").trim();

  const where = {
    empresaId: user.empresaId,
    ...(status &&
    ["ABERTA", "EM_ANDAMENTO", "FECHADA", "CANCELADA"].includes(status)
      ? { status: status as any }
      : {}),
    ...(q
      ? {
          OR: [
            { observacoes: { contains: q } },
            { cliente: { nome: { contains: q } } },
            {
              profissionalPrincipal: {
                nome: { contains: q },
              },
            },
          ],
        }
      : {}),
  };

  const [comandas, resumo] = await Promise.all([
    prisma.comanda.findMany({
      where,
      include: {
        cliente: {
          select: {
            id: true,
            nome: true,
          },
        },
        profissionalPrincipal: {
          select: {
            id: true,
            nome: true,
          },
        },
        agendamento: {
          select: {
            id: true,
            inicio: true,
          },
        },
        itens: {
          select: {
            id: true,
            tipo: true,
            descricao: true,
            quantidade: true,
            valorTotal: true,
          },
          orderBy: {
            createdAt: "asc",
          },
        },
        pagamentos: {
          select: {
            id: true,
            metodo: true,
            valor: true,
          },
        },
      },
      orderBy: [{ abertaEm: "desc" }],
    }),

    prisma.comanda.groupBy({
      by: ["status"],
      where: {
        empresaId: user.empresaId,
      },
      _count: {
        _all: true,
      },
    }),
  ]);

  const totalAbertas =
    resumo.find((item) => item.status === "ABERTA")?._count._all ?? 0;
  const totalEmAndamento =
    resumo.find((item) => item.status === "EM_ANDAMENTO")?._count._all ?? 0;
  const totalFechadas =
    resumo.find((item) => item.status === "FECHADA")?._count._all ?? 0;
  const totalCanceladas =
    resumo.find((item) => item.status === "CANCELADA")?._count._all ?? 0;

  return (
    <div className="space-y-6">
      <Link
        href="/home"
        className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
      >
        ← Voltar
      </Link>

      <PageHeader
        title="Comandas"
        description="Atendimentos, itens, pagamentos e recibos."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
          <div className="text-sm font-medium text-emerald-700">Abertas</div>
          <div className="mt-2 text-3xl font-bold text-emerald-800">
            {totalAbertas}
          </div>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
          <div className="text-sm font-medium text-amber-700">Em andamento</div>
          <div className="mt-2 text-3xl font-bold text-amber-800">
            {totalEmAndamento}
          </div>
        </div>

        <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 shadow-sm">
          <div className="text-sm font-medium text-sky-700">Fechadas</div>
          <div className="mt-2 text-3xl font-bold text-sky-800">
            {totalFechadas}
          </div>
        </div>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 shadow-sm">
          <div className="text-sm font-medium text-red-700">Canceladas</div>
          <div className="mt-2 text-3xl font-bold text-red-800">
            {totalCanceladas}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4 shadow-sm">
        <form className="grid gap-3 md:grid-cols-[1fr_220px_auto]">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Buscar por cliente, profissional ou observação..."
            className="h-11 w-full rounded-xl border border-[var(--line)] bg-white px-3 text-sm outline-none transition focus:border-slate-900"
          />

          <select
            name="status"
            defaultValue={status}
            className="h-11 w-full rounded-xl border border-[var(--line)] bg-white px-3 text-sm outline-none transition focus:border-slate-900"
          >
            <option value="">Todos os status</option>
            <option value="ABERTA">Aberta</option>
            <option value="EM_ANDAMENTO">Em andamento</option>
            <option value="FECHADA">Fechada</option>
            <option value="CANCELADA">Cancelada</option>
          </select>

          <button
            type="submit"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            Buscar
          </button>
        </form>
      </div>

      <div className="space-y-4">
        {comandas.map((comanda) => {
          const totalPago = comanda.pagamentos.reduce(
            (acc, pagamento) => acc + Number(pagamento.valor || 0),
            0
          );

          return (
            <div
              key={comanda.id}
              className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-5 shadow-sm"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-bold text-[var(--text)]">
                      Comanda #{comanda.numeroSequencial}
                    </h2>

                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadge(
                        comanda.status
                      )}`}
                    >
                      {comanda.status}
                    </span>
                  </div>

                  <div className="grid gap-2 text-sm text-[var(--muted)] md:grid-cols-2 xl:grid-cols-4">
                    <p>
                      Cliente:{" "}
                      <span className="font-semibold text-[var(--text)]">
                        {comanda.cliente?.nome || "-"}
                      </span>
                    </p>

                    <p>
                      Profissional:{" "}
                      <span className="font-semibold text-[var(--text)]">
                        {comanda.profissionalPrincipal?.nome || "-"}
                      </span>
                    </p>

                    <p>
                      Aberta em:{" "}
                      <span className="font-semibold text-[var(--text)]">
                        {formatDateTime(comanda.abertaEm)}
                      </span>
                    </p>

                    <p>
                      Fechada em:{" "}
                      <span className="font-semibold text-[var(--text)]">
                        {formatDateTime(comanda.fechadaEm)}
                      </span>
                    </p>
                  </div>

                  {comanda.agendamento ? (
                    <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-700">
                      Agendamento vinculado: {formatDateTime(comanda.agendamento.inicio)}
                    </div>
                  ) : null}

                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3">
                      <div className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                        Total
                      </div>
                      <div className="mt-1 text-base font-bold text-[var(--text)]">
                        {money(Number(comanda.total))}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3">
                      <div className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                        Pago
                      </div>
                      <div className="mt-1 text-base font-bold text-[var(--text)]">
                        {money(totalPago)}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3">
                      <div className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                        Itens
                      </div>
                      <div className="mt-1 text-base font-bold text-[var(--text)]">
                        {comanda.itens.length}
                      </div>
                    </div>
                  </div>

                  {comanda.itens.length ? (
                    <div className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3">
                      <div className="mb-2 text-sm font-semibold text-[var(--text)]">
                        Itens
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {comanda.itens.slice(0, 6).map((item) => (
                          <span
                            key={item.id}
                            className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
                          >
                            {item.descricao} ({Number(item.quantidade)})
                          </span>
                        ))}
                        {comanda.itens.length > 6 ? (
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                            +{comanda.itens.length - 6} itens
                          </span>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="flex shrink-0 flex-wrap gap-2">
                  <Link
                    href={`/comandas/${comanda.id}`}
                    className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                  >
                    Abrir comanda
                  </Link>

                  {comanda.agendamentoId ? (
                    <Link
                      href={`/agenda/${comanda.agendamentoId}/editar`}
                      className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                    >
                      Ver agenda
                    </Link>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}

        {!comandas.length ? (
          <div className="rounded-2xl border border-dashed border-[var(--line)] bg-[var(--card)] px-6 py-10 text-center text-sm text-[var(--muted)]">
            Nenhuma comanda encontrada.
          </div>
        ) : null}
      </div>
    </div>
  );
}
