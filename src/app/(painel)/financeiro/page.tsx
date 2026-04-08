import Link from "next/link";
import { StatusConta, TipoCaixaMovimento } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import PanelBackButton from "@/components/PanelBackButton";
import {
  atualizarContasVencidasAction,
  getResumoFinanceiro,
} from "@/actions/financeiro";

type SearchParams = Promise<{
  de?: string;
  ate?: string;
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

export default async function FinanceiroPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const user = await requireUser();
  const params = (await searchParams) ?? {};

  const de = params.de || null;
  const ate = params.ate || null;

  const [resumo, contasReceber, contasPagar, ultimosMovimentos] =
    await Promise.all([
      getResumoFinanceiro({ de, ate }),
      prisma.contaReceber.findMany({
        where: {
          empresaId: user.empresaId,
          status: {
            in: [StatusConta.ABERTA, StatusConta.PARCIAL, StatusConta.VENCIDA],
          },
        },
        include: {
          cliente: {
            select: {
              nome: true,
            },
          },
        },
        orderBy: [{ vencimento: "asc" }, { createdAt: "desc" }],
        take: 5,
      }),
      prisma.contaPagar.findMany({
        where: {
          empresaId: user.empresaId,
          status: {
            in: [StatusConta.ABERTA, StatusConta.PARCIAL, StatusConta.VENCIDA],
          },
        },
        include: {
          fornecedor: {
            select: {
              nome: true,
            },
          },
        },
        orderBy: [{ vencimento: "asc" }, { createdAt: "desc" }],
        take: 5,
      }),
      prisma.caixaMovimento.findMany({
        where: {
          empresaId: user.empresaId,
        },
        orderBy: [{ dataMovimento: "desc" }, { createdAt: "desc" }],
        take: 8,
      }),
    ]);

  return (

    <div className="space-y-6">
      <PanelBackButton href="/dashboard" label="Voltar" />
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>

          <h1 className="text-2xl font-bold tracking-tight">Financeiro</h1>
          <p className="text-sm text-zinc-600">
            Visão geral de caixa, contas a receber e contas a pagar.
          </p>
        </div>

        <form className="grid gap-2 sm:grid-cols-2 md:flex" method="get">
          <input
            type="date"
            name="de"
            defaultValue={de ?? ""}
            className="rounded-xl border border-zinc-300 px-3 py-2 text-sm"
          />
          <input
            type="date"
            name="ate"
            defaultValue={ate ?? ""}
            className="rounded-xl border border-zinc-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            Filtrar
          </button>
        </form>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className={cardClass()}>
          <div className="text-sm text-zinc-500">Entradas</div>
          <div className="mt-2 text-2xl font-bold">
            {formatMoney(resumo.entradas)}
          </div>
        </div>

        <div className={cardClass()}>
          <div className="text-sm text-zinc-500">Saídas</div>
          <div className="mt-2 text-2xl font-bold">
            {formatMoney(resumo.saidas)}
          </div>
        </div>

        <div className={cardClass()}>
          <div className="text-sm text-zinc-500">Saldo</div>
          <div
            className={`mt-2 text-2xl font-bold ${Number(resumo.saldo) >= 0 ? "text-emerald-600" : "text-red-600"
              }`}
          >
            {formatMoney(resumo.saldo)}
          </div>
        </div>

        <div className={cardClass()}>
          <div className="text-sm text-zinc-500">A receber em aberto</div>
          <div className="mt-2 text-2xl font-bold">
            {formatMoney(resumo.contasReceberAberto)}
          </div>
        </div>

        <div className={cardClass()}>
          <div className="text-sm text-zinc-500">A pagar em aberto</div>
          <div className="mt-2 text-2xl font-bold">
            {formatMoney(resumo.contasPagarAberto)}
          </div>
        </div>

        <div className={cardClass()}>
          <div className="text-sm text-zinc-500">Receber vencido</div>
          <div className="mt-2 text-2xl font-bold text-amber-600">
            {formatMoney(resumo.contasReceberVencido)}
          </div>
        </div>

        <div className={cardClass()}>
          <div className="text-sm text-zinc-500">Pagar vencido</div>
          <div className="mt-2 text-2xl font-bold text-red-600">
            {formatMoney(resumo.contasPagarVencido)}
          </div>
        </div>

        <div className={cardClass("flex flex-col justify-between")}>
          <div>
            <div className="text-sm text-zinc-500">Atualizar vencidas</div>
            <div className="mt-2 text-sm text-zinc-600">
              Marca contas atrasadas como vencidas.
            </div>
          </div>

          <form action={atualizarContasVencidasAction} className="mt-4">
            <button
              type="submit"
              className="w-full rounded-xl bg-amber-500 px-4 py-2 text-sm font-medium text-white"
            >
              Atualizar agora
            </button>
          </form>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Link
          href="/financeiro/caixa"
          className={cardClass("transition hover:-translate-y-0.5")}
        >
          <div className="text-lg font-semibold">Caixa</div>
          <p className="mt-2 text-sm text-zinc-600">
            Entradas, saídas, sangria, suprimento e estornos.
          </p>
        </Link>

        <Link
          href="/financeiro/contas-receber"
          className={cardClass("transition hover:-translate-y-0.5")}
        >
          <div className="text-lg font-semibold">Contas a Receber</div>
          <p className="mt-2 text-sm text-zinc-600">
            Fiado, cobranças pendentes e recebimentos.
          </p>
        </Link>

        <Link
          href="/financeiro/contas-pagar"
          className={cardClass("transition hover:-translate-y-0.5")}
        >
          <div className="text-lg font-semibold">Contas a Pagar</div>
          <p className="mt-2 text-sm text-zinc-600">
            Despesas, fornecedores e pagamentos.
          </p>
        </Link>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className={cardClass()}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Próximas contas a receber</h2>
            <Link
              href="/financeiro/contas-receber"
              className="text-sm font-medium text-zinc-700 underline"
            >
              Ver tudo
            </Link>
          </div>

          <div className="space-y-3">
            {contasReceber.length === 0 ? (
              <div className="text-sm text-zinc-500">
                Nenhuma conta a receber em aberto.
              </div>
            ) : (
              contasReceber.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-zinc-200 p-3"
                >
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="font-medium">{item.descricao}</div>
                      <div className="text-sm text-zinc-500">
                        Cliente: {item.cliente?.nome || "Sem cliente"} •
                        Vencimento: {formatDateBR(item.vencimento)}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-semibold">
                        {formatMoney(item.valorAberto)}
                      </div>
                      <div className="text-xs uppercase text-zinc-500">
                        {item.status}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className={cardClass()}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Próximas contas a pagar</h2>
            <Link
              href="/financeiro/contas-pagar"
              className="text-sm font-medium text-zinc-700 underline"
            >
              Ver tudo
            </Link>
          </div>

          <div className="space-y-3">
            {contasPagar.length === 0 ? (
              <div className="text-sm text-zinc-500">
                Nenhuma conta a pagar em aberto.
              </div>
            ) : (
              contasPagar.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-zinc-200 p-3"
                >
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="font-medium">{item.descricao}</div>
                      <div className="text-sm text-zinc-500">
                        Fornecedor: {item.fornecedor?.nome || "Sem fornecedor"} •
                        Vencimento: {formatDateBR(item.vencimento)}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-semibold">
                        {formatMoney(item.valorAberto)}
                      </div>
                      <div className="text-xs uppercase text-zinc-500">
                        {item.status}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className={cardClass()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Últimos movimentos do caixa</h2>
          <Link
            href="/financeiro/caixa"
            className="text-sm font-medium text-zinc-700 underline"
          >
            Ver caixa
          </Link>
        </div>

        <div className="space-y-3">
          {ultimosMovimentos.length === 0 ? (
            <div className="text-sm text-zinc-500">
              Nenhum movimento encontrado.
            </div>
          ) : (
            ultimosMovimentos.map((movimento) => (
              <div
                key={movimento.id}
                className="flex flex-col gap-2 rounded-xl border border-zinc-200 p-3 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <div className="font-medium">{movimento.descricao}</div>
                  <div className="text-sm text-zinc-500">
                    {movimento.categoria} • {formatDateBR(movimento.dataMovimento)}
                  </div>
                </div>

                <div
                  className={`font-semibold ${movimento.tipo === TipoCaixaMovimento.ENTRADA
                    ? "text-emerald-600"
                    : "text-red-600"
                    }`}
                >
                  {movimento.tipo === TipoCaixaMovimento.ENTRADA ? "+" : "-"}{" "}
                  {formatMoney(movimento.valor)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}