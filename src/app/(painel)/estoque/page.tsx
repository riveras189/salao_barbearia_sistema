import Link from "next/link";
import PageHeader from "@/components/layout/PageHeader";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import {
  registrarMovimentoEstoqueAction,
  excluirMovimentoEstoqueAction,
} from "@/actions/produtos";

type PageProps = {
  searchParams?: Promise<{
    ok?: string;
    error?: string;
    produtoId?: string;
  }>;
};

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export default async function EstoquePage({ searchParams }: PageProps) {
  const user = await requireUser();
  const params = (await searchParams) ?? {};
  const produtoIdSelecionado = String(params.produtoId ?? "");

  const [produtos, movimentacoes, produtosBaixoEstoque] = await Promise.all([
    prisma.produto.findMany({
      where: {
        empresaId: user.empresaId,
        ativo: true,
      },
      orderBy: { nome: "asc" },
      select: {
        id: true,
        nome: true,
        estoqueAtual: true,
        estoqueMinimo: true,
        unidade: true,
      },
    }),

    prisma.estoqueMovimentacao.findMany({
      where: {
        empresaId: user.empresaId,
      },
      include: {
        produto: {
          select: {
            nome: true,
            unidade: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),

    prisma.produto.findMany({
      where: {
        empresaId: user.empresaId,
        ativo: true,
      },
      orderBy: { nome: "asc" },
      select: {
        id: true,
        nome: true,
        estoqueAtual: true,
        estoqueMinimo: true,
      },
    }),
  ]);

  const baixos = produtosBaixoEstoque.filter(
    (item) => item.estoqueAtual <= item.estoqueMinimo
  );

  return (
    <div className="space-y-6">
      <Link
        href="/produtos"
        className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
      >
        ← Voltar
      </Link>

      <PageHeader
        title="Estoque"
        description="Controle entradas, saídas para venda, uso interno e movimentações."
      />

      {params.ok ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {params.ok === "mov" && "Movimentação registrada com sucesso."}
          {params.ok === "deleted" && "Movimentação excluída com sucesso."}
        </div>
      ) : null}

      {params.error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {params.error}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[420px_minmax(0,1fr)]">
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-5 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-[var(--text)]">
            Nova movimentação
          </h2>

          <form action={registrarMovimentoEstoqueAction} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--text)]">
                Produto
              </label>
              <select
                name="produtoId"
                defaultValue={produtoIdSelecionado}
                className="w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[var(--primary)]"
                required
              >
                <option value="">Selecione</option>
                {produtos.map((produto) => (
                  <option key={produto.id} value={produto.id}>
                    {produto.nome} — saldo {produto.estoqueAtual} {produto.unidade}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--text)]">
                  Tipo
                </label>
                <select
                  name="tipo"
                  defaultValue="ENTRADA"
                  className="w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[var(--primary)]"
                >
                  <option value="ENTRADA">Entrada</option>
                  <option value="SAIDA">Saída</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--text)]">
                  Finalidade
                </label>
                <select
                  name="finalidade"
                  defaultValue="COMPRA"
                  className="w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[var(--primary)]"
                >
                  <option value="COMPRA">Compra / reposição</option>
                  <option value="VENDA">Venda</option>
                  <option value="USO_INTERNO">Uso interno</option>
                  <option value="AJUSTE">Ajuste</option>
                  <option value="PERDA">Perda / quebra</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--text)]">
                Quantidade
              </label>
              <input
                type="number"
                name="quantidade"
                min="1"
                step="1"
                defaultValue={1}
                required
                className="w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[var(--primary)]"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--text)]">
                Observação
              </label>
              <textarea
                name="observacao"
                rows={3}
                placeholder="Ex.: compra do fornecedor, uso no salão, venda no balcão..."
                className="w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[var(--primary)]"
              />
            </div>

            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              Registrar movimentação
            </button>
          </form>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-5 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-[var(--text)]">
              Alertas de estoque
            </h2>

            {baixos.length ? (
              <div className="grid gap-3 md:grid-cols-2">
                {baixos.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3"
                  >
                    <div className="text-sm font-semibold text-amber-800">
                      {item.nome}
                    </div>
                    <div className="mt-1 text-sm text-amber-700">
                      Saldo atual: {item.estoqueAtual} | Mínimo: {item.estoqueMinimo}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                Nenhum produto com estoque baixo.
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-5 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-[var(--text)]">
              Últimas movimentações
            </h2>

            <div className="space-y-3">
              {movimentacoes.map((mov) => (
                <div
                  key={mov.id}
                  className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="text-sm font-semibold text-[var(--text)]">
                          {mov.produto.nome}
                        </div>

                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            mov.tipo === "ENTRADA"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {mov.tipo === "ENTRADA" ? "Entrada" : "Saída"}
                        </span>
                      </div>

                      <div className="mt-2 grid gap-1 text-sm text-[var(--muted)] md:grid-cols-2">
                        <p>
                          Quantidade: {mov.quantidade} {mov.produto.unidade}
                        </p>
                        <p>Saldo anterior: {mov.saldoAnterior}</p>
                        <p>Saldo atual: {mov.saldoAtual}</p>
                        <p>Data: {formatDateTime(mov.createdAt)}</p>
                      </div>

                      {mov.observacao ? (
                        <p className="mt-2 text-sm text-[var(--text)]">
                          Observação: {mov.observacao}
                        </p>
                      ) : null}
                    </div>

                    <form action={excluirMovimentoEstoqueAction}>
                      <input type="hidden" name="movimentoId" value={mov.id} />
                      <button
                        type="submit"
                        className="inline-flex h-10 items-center justify-center rounded-xl border border-red-700 bg-red-700 px-4 text-sm font-semibold text-white transition hover:bg-red-800"
                      >
                        Excluir
                      </button>
                    </form>
                  </div>
                </div>
              ))}

              {!movimentacoes.length ? (
                <div className="rounded-2xl border border-dashed border-[var(--line)] px-4 py-8 text-center text-sm text-[var(--muted)]">
                  Nenhuma movimentação encontrada.
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}