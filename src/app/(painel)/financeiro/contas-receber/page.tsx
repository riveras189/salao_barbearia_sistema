import { FormaPagamento, StatusConta } from "@prisma/client";
import PanelBackButton from "@/components/PanelBackButton";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import {
  criarContaReceberAction,
  receberContaReceberAction,
} from "@/actions/financeiro";

type SearchParams = Promise<{
  status?: string;
  q?: string;
}>;

function formatMoney(value: unknown) {
  const number = Number(value ?? 0);
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(number);
}

function formatDateBR(value?: Date | string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("pt-BR").format(new Date(value));
}

function cardClass(extra = "") {
  return `rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm ${extra}`;
}

function statusClass(status: StatusConta) {
  switch (status) {
    case StatusConta.PAGA:
      return "bg-emerald-100 text-emerald-700";
    case StatusConta.VENCIDA:
      return "bg-red-100 text-red-700";
    case StatusConta.PARCIAL:
      return "bg-amber-100 text-amber-700";
    case StatusConta.CANCELADA:
      return "bg-zinc-200 text-zinc-700";
    default:
      return "bg-blue-100 text-blue-700";
  }
}

export default async function ContasReceberPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const user = await requireUser();
  const params = (await searchParams) ?? {};

  const status = (params.status || "").trim();
  const q = (params.q || "")
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  const [clientes, contasRaw] = await Promise.all([
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
    prisma.contaReceber.findMany({
      where: {
        empresaId: user.empresaId,
        ...(status ? { status: status as StatusConta } : {}),
      },
      include: {
        cliente: {
          select: {
            nome: true,
          },
        },
      },
      orderBy: [{ vencimento: "asc" }, { createdAt: "desc" }],
      take: 200,
    }),
  ]);

  const contas = q
    ? contasRaw.filter((conta) => {
        const clienteNome = (conta.cliente?.nome || "")
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '');
        const descricao = (conta.descricao || "")
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '');
        const origem = (conta.origemTipo || "")
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '');

        return (
          descricao.includes(q) ||
          clienteNome.includes(q) ||
          origem.includes(q)
        );
      })
    : contasRaw;

  return (
    <div className="space-y-6">
      <PanelBackButton href="/financeiro" label="Voltar para Financeiro" />
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Contas a Receber</h1>
        <p className="text-sm text-zinc-600">
          Controle de fiado, cobranças e recebimentos.
        </p>
      </div>

      <form method="get" className={cardClass("grid gap-3 md:grid-cols-3")}>
        <input
          type="text"
          name="q"
          defaultValue={params.q || ""}
          placeholder="Buscar por descrição ou cliente"
          className="rounded-xl border border-zinc-300 px-3 py-2 text-sm"
        />

        <select
          name="status"
          defaultValue={status}
          className="rounded-xl border border-zinc-300 px-3 py-2 text-sm"
        >
          <option value="">Todos os status</option>
          {Object.values(StatusConta).map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <button
          type="submit"
          className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
        >
          Filtrar
        </button>
      </form>

      <form action={criarContaReceberAction} className={cardClass("grid gap-3")}>
        <h2 className="text-lg font-semibold">Nova conta a receber</h2>

        <div className="grid gap-3 xl:grid-cols-4">
          <select
            name="clienteId"
            className="rounded-xl border border-zinc-300 px-3 py-2 text-sm"
            defaultValue=""
          >
            <option value="">Sem cliente</option>
            {clientes.map((cliente) => (
              <option key={cliente.id} value={cliente.id}>
                {cliente.nome}
              </option>
            ))}
          </select>

          <input
            type="text"
            name="descricao"
            placeholder="Descrição"
            required
            className="rounded-xl border border-zinc-300 px-3 py-2 text-sm xl:col-span-2"
          />

          <input
            type="number"
            step="0.01"
            min="0.01"
            name="valorOriginal"
            placeholder="Valor"
            required
            className="rounded-xl border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="grid gap-3 xl:grid-cols-3">
          <input
            type="date"
            name="vencimento"
            className="rounded-xl border border-zinc-300 px-3 py-2 text-sm"
          />

          <input
            type="text"
            name="origemTipo"
            placeholder="Origem tipo (opcional)"
            className="rounded-xl border border-zinc-300 px-3 py-2 text-sm"
          />

          <input
            type="text"
            name="origemId"
            placeholder="Origem ID (opcional)"
            className="rounded-xl border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>

        <button
          type="submit"
          className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
        >
          Lançar conta
        </button>
      </form>

      <div className={cardClass()}>
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Lançamentos</h2>
        </div>

        <div className="space-y-4">
          {contas.length === 0 ? (
            <div className="text-sm text-zinc-500">
              Nenhuma conta a receber encontrada.
            </div>
          ) : (
            contas.map((conta) => {
              const podeReceber =
                conta.status !== StatusConta.PAGA &&
                conta.status !== StatusConta.CANCELADA &&
                Number(conta.valorAberto) > 0;

              return (
                <div
                  key={conta.id}
                  className="rounded-xl border border-zinc-200 p-4"
                >
                  <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                    <div className="space-y-1">
                      <div className="font-medium">{conta.descricao}</div>
                      <div className="text-sm text-zinc-500">
                        Cliente: {conta.cliente?.nome || "Sem cliente"}
                      </div>
                      <div className="text-sm text-zinc-500">
                        Vencimento: {formatDateBR(conta.vencimento)}
                      </div>
                      <div className="text-sm text-zinc-500">
                        Origem: {conta.origemTipo || "-"}
                      </div>
                    </div>

                    <div className="text-left xl:text-right">
                      <div className="font-semibold">
                        Original: {formatMoney(conta.valorOriginal)}
                      </div>
                      <div className="font-semibold">
                        Aberto: {formatMoney(conta.valorAberto)}
                      </div>
                      <div className="mt-2">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(
                            conta.status,
                          )}`}
                        >
                          {conta.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {podeReceber && (
                    <form
                      action={receberContaReceberAction}
                      className="mt-4 grid gap-3 rounded-xl bg-zinc-50 p-3 xl:grid-cols-5"
                    >
                      <input
                        type="hidden"
                        name="contaReceberId"
                        value={conta.id}
                      />

                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        max={Number(conta.valorAberto)}
                        name="valor"
                        defaultValue={Number(conta.valorAberto).toFixed(2)}
                        required
                        className="rounded-xl border border-zinc-300 px-3 py-2 text-sm"
                      />

                      <select
                        name="metodo"
                        defaultValue={FormaPagamento.DINHEIRO}
                        className="rounded-xl border border-zinc-300 px-3 py-2 text-sm"
                      >
                        {Object.values(FormaPagamento)
                          .filter((item) => item !== FormaPagamento.FIADO)
                          .map((item) => (
                            <option key={item} value={item}>
                              {item}
                            </option>
                          ))}
                      </select>

                      <input
                        type="datetime-local"
                        name="pagoEm"
                        className="rounded-xl border border-zinc-300 px-3 py-2 text-sm"
                      />

                      <input
                        type="text"
                        name="observacao"
                        placeholder="Observação"
                        className="rounded-xl border border-zinc-300 px-3 py-2 text-sm"
                      />

                      <button
                        type="submit"
                        className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white"
                      >
                        Receber
                      </button>
                    </form>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}