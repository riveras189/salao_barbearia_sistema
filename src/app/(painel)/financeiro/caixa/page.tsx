import { CategoriaCaixaMovimento, FormaPagamento, TipoCaixaMovimento } from "@prisma/client";
import PanelBackButton from "@/components/PanelBackButton";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import {
  estornarMovimentoCaixaAction,
  lancarSangriaAction,
  lancarSuprimentoAction,
  abrirCaixaManualmenteAction,
} from "@/actions/financeiro";

type SearchParams = Promise<{
  de?: string;
  ate?: string;
  categoria?: string;
}>;

function formatMoney(value: unknown) {
  const number = Number(value ?? 0);
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(number);
}

function formatDateTimeBR(value?: Date | string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function cardClass(extra = "") {
  return `rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm ${extra}`;
}

export default async function CaixaPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const user = await requireUser();
  const params = (await searchParams) ?? {};

  const de = params.de || "";
  const ate = params.ate || "";
  const categoria = params.categoria || "";

  // Busca o caixa aberto/fechado para hoje
  const hoje = new Date();
  const inicioDoDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  const fimDoDia = new Date(inicioDoDia.getTime() + 24 * 60 * 60 * 1000);

  const caixaHoje = await prisma.caixaFechamento.findFirst({
    where: {
      empresaId: user.empresaId,
      dataAbertura: {
        gte: inicioDoDia,
        lt: fimDoDia,
      },
    },
  });

  const where = {
    empresaId: user.empresaId,
    ...(categoria ? { categoria: categoria as CategoriaCaixaMovimento } : {}),
    ...((de || ate) && {
      dataMovimento: {
        ...(de ? { gte: new Date(`${de}T00:00:00`) } : {}),
        ...(ate ? { lte: new Date(`${ate}T23:59:59.999`) } : {}),
      },
    }),
  };

  const [movimentos, entradas, saidas] = await Promise.all([
    prisma.caixaMovimento.findMany({
      where,
      orderBy: [{ dataMovimento: "desc" }, { createdAt: "desc" }],
      take: 100,
    }),
    prisma.caixaMovimento.aggregate({
      where: {
        ...where,
        tipo: TipoCaixaMovimento.ENTRADA,
      },
      _sum: { valor: true },
    }),
    prisma.caixaMovimento.aggregate({
      where: {
        ...where,
        tipo: TipoCaixaMovimento.SAIDA,
      },
      _sum: { valor: true },
    }),
  ]);

  const totalEntradas = Number(entradas._sum.valor ?? 0);
  const totalSaidas = Number(saidas._sum.valor ?? 0);
  const saldo = totalEntradas - totalSaidas;

  return (
    <div className="space-y-6">
      <PanelBackButton href="/financeiro" label="Voltar para Financeiro" />
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Caixa</h1>
        <p className="text-sm text-zinc-600">
          Controle de entradas, saídas, sangrias, suprimentos e estornos.
        </p>
      </div>

      <form method="get" className={cardClass("grid gap-3 md:grid-cols-4")}>
        <input
          type="date"
          name="de"
          defaultValue={de}
          className="rounded-xl border border-zinc-300 px-3 py-2 text-sm"
        />
        <input
          type="date"
          name="ate"
          defaultValue={ate}
          className="rounded-xl border border-zinc-300 px-3 py-2 text-sm"
        />
        <select
          name="categoria"
          defaultValue={categoria}
          className="rounded-xl border border-zinc-300 px-3 py-2 text-sm"
        >
          <option value="">Todas as categorias</option>
          {Object.values(CategoriaCaixaMovimento).map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <button
          type="submit"
         className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
        >
          Filtrar
        </button>
      </form>

      <div className="grid gap-4 md:grid-cols-3">
        <div className={cardClass()}>
          <div className="text-sm text-zinc-500">Entradas</div>
          <div className="mt-2 text-2xl font-bold text-emerald-600">
            {formatMoney(totalEntradas)}
          </div>
        </div>
        <div className={cardClass()}>
          <div className="text-sm text-zinc-500">Saídas</div>
          <div className="mt-2 text-2xl font-bold text-red-600">
            {formatMoney(totalSaidas)}
          </div>
        </div>
        <div className={cardClass()}>
          <div className="text-sm text-zinc-500">Saldo</div>
          <div
            className={`mt-2 text-2xl font-bold ${
              saldo >= 0 ? "text-emerald-600" : "text-red-600"
            }`}
          >
            {formatMoney(saldo)}
          </div>
        </div>
      </div>

      {/* Status do Caixa */}
      <div className={cardClass()}>
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Status do Caixa</h2>
            {caixaHoje ? (
              <div className="mt-2 text-sm text-zinc-600">
                <div className="flex items-center gap-2">
                  <span className={`inline-block h-2 w-2 rounded-full ${
                    caixaHoje.dataFechamento ? "bg-gray-400" : "bg-emerald-500"
                  }`} />
                  {caixaHoje.dataFechamento ? (
                    <>Caixa fechado às {formatDateTimeBR(caixaHoje.dataFechamento)}</>
                  ) : (
                    <>Caixa aberto às {formatDateTimeBR(caixaHoje.dataAbertura)}</>
                  )}
                </div>
                {caixaHoje.saldoAbertura && (
                  <div>Saldo de abertura: {formatMoney(caixaHoje.saldoAbertura)}</div>
                )}
                {caixaHoje.dataFechamento && caixaHoje.saldoFechamento && (
                  <div>Saldo de fechamento: {formatMoney(caixaHoje.saldoFechamento)}</div>
                )}
              </div>
            ) : (
              <div className="mt-2 text-sm text-zinc-600">
                <div className="flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-yellow-500" />
                  Caixa não foi aberto hoje
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 xl:flex-row">
            {!caixaHoje || caixaHoje.dataFechamento ? (
              <form action={abrirCaixaManualmenteAction} className="contents">
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    name="saldoAbertura"
                    placeholder="Saldo inicial (opcional)"
                    defaultValue="0"
                    className="rounded-xl border border-zinc-300 px-3 py-2 text-sm"
                  />
                  <button
                    type="submit"
                    className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white whitespace-nowrap"
                  >
                    Abrir Caixa
                  </button>
                </div>
              </form>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <form action={lancarSuprimentoAction} className={cardClass("grid gap-3")}>
          <h2 className="text-lg font-semibold">Lançar suprimento</h2>

          <input
            type="text"
            name="descricao"
            placeholder="Descrição do suprimento"
            className="rounded-xl border border-zinc-300 px-3 py-2 text-sm"
          />

          <div className="grid gap-3 md:grid-cols-3">
            <input
              type="number"
              step="0.01"
              min="0.01"
              name="valor"
              placeholder="Valor"
              required
              className="rounded-xl border border-zinc-300 px-3 py-2 text-sm"
            />

            <select
              name="formaPagamento"
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
              name="dataMovimento"
              className="rounded-xl border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>

          <button
            type="submit"
            className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white"
          >
            Lançar suprimento
          </button>
        </form>

        <form action={lancarSangriaAction} className={cardClass("grid gap-3")}>
          <h2 className="text-lg font-semibold">Lançar sangria</h2>

          <input
            type="text"
            name="descricao"
            placeholder="Descrição da sangria"
            className="rounded-xl border border-zinc-300 px-3 py-2 text-sm"
          />

          <div className="grid gap-3 md:grid-cols-3">
            <input
              type="number"
              step="0.01"
              min="0.01"
              name="valor"
              placeholder="Valor"
              required
              className="rounded-xl border border-zinc-300 px-3 py-2 text-sm"
            />

            <select
              name="formaPagamento"
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
              name="dataMovimento"
              className="rounded-xl border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>

          <button
            type="submit"
            className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white"
          >
            Lançar sangria
          </button>
        </form>
      </div>

      <div className={cardClass()}>
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Movimentos</h2>
        </div>

        <div className="space-y-3">
          {movimentos.length === 0 ? (
            <div className="text-sm text-zinc-500">
              Nenhum movimento encontrado.
            </div>
          ) : (
            movimentos.map((movimento) => (
              <div
                key={movimento.id}
                className="rounded-xl border border-zinc-200 p-3"
              >
                <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                  <div>
                    <div className="font-medium">{movimento.descricao}</div>
                    <div className="text-sm text-zinc-500">
                      {movimento.categoria} • {movimento.formaPagamento || "-"} •{" "}
                      {formatDateTimeBR(movimento.dataMovimento)}
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
                    <div
                      className={`text-right font-semibold ${
                        movimento.tipo === TipoCaixaMovimento.ENTRADA
                          ? "text-emerald-600"
                          : "text-red-600"
                      }`}
                    >
                      {movimento.tipo === TipoCaixaMovimento.ENTRADA ? "+" : "-"}{" "}
                      {formatMoney(movimento.valor)}
                    </div>

                    {movimento.categoria !== CategoriaCaixaMovimento.ESTORNO && (
                      <form action={estornarMovimentoCaixaAction}>
                        <input type="hidden" name="movimentoId" value={movimento.id} />
                        <button
                          type="submit"
                          className="rounded-xl border border-zinc-300 px-3 py-2 text-sm font-medium"
                        >
                          Estornar
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}