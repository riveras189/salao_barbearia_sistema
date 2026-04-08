import Link from "next/link";
import { notFound } from "next/navigation";
import PageHeader from "@/components/layout/PageHeader";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import {
  adicionarPagamentoComandaAction,
  adicionarProdutoComandaAction,
  adicionarServicoComandaAction,
  atualizarResumoComandaAction,
  finalizarComandaAction,
  removerItemComandaAction,
  removerPagamentoComandaAction,
} from "@/actions/comandas";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{
    ok?: string;
    error?: string;
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

export default async function ComandaDetalhePage({
  params,
  searchParams,
}: PageProps) {
  const user = await requireUser();
  const { id } = await params;
  const qs = (await searchParams) ?? {};

  const [comanda, produtos, servicos, profissionais] = await Promise.all([
    prisma.comanda.findFirst({
      where: {
        id,
        empresaId: user.empresaId,
      },
      include: {
        cliente: true,
        profissionalPrincipal: true,
        agendamento: true,
        itens: {
          include: {
            produto: true,
            servico: true,
            profissional: true,
          },
          orderBy: {
            createdAt: "asc",
          },
        },
        pagamentos: {
          orderBy: {
            pagoEm: "asc",
          },
        },
      },
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
        preco: true,
        estoqueAtual: true,
        unidade: true,
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
        preco: true,
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

  if (!comanda) notFound();

  const totalPago = comanda.pagamentos.reduce(
    (acc, pagamento) => acc + Number(pagamento.valor || 0),
    0
  );

  const restante = Number(comanda.total || 0) - totalPago;

  return (
    <div className="space-y-6">
      <Link
        href="/agenda"
        className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
      >
        ← Voltar
      </Link>

      <PageHeader
        title={`Comanda #${comanda.numeroSequencial}`}
        description="Serviços, produtos, pagamentos e fechamento da comanda."
      />

      {qs.ok ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {qs.ok === "servico" && "Serviço adicionado com sucesso."}
          {qs.ok === "produto" && "Produto adicionado com sucesso."}
          {qs.ok === "removed-item" && "Item removido com sucesso."}
          {qs.ok === "resumo" && "Resumo da comanda atualizado com sucesso."}
          {qs.ok === "pagamento" && "Pagamento adicionado com sucesso."}
          {qs.ok === "removed-payment" && "Pagamento removido com sucesso."}
          {qs.ok === "finalizada" && "Comanda finalizada com sucesso."}
        </div>
      ) : null}

      {qs.error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {qs.error}
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[1.3fr_0.9fr]">
        <div className="space-y-4">
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-5 shadow-sm">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                  Status
                </p>
                <p className="mt-1 text-sm font-semibold text-[var(--text)]">
                  {comanda.status}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                  Cliente
                </p>
                <p className="mt-1 text-sm font-semibold text-[var(--text)]">
                  {comanda.cliente?.nome || "-"}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                  Profissional
                </p>
                <p className="mt-1 text-sm font-semibold text-[var(--text)]">
                  {comanda.profissionalPrincipal?.nome || "-"}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                  Aberta em
                </p>
                <p className="mt-1 text-sm font-semibold text-[var(--text)]">
                  {formatDateTime(comanda.abertaEm)}
                </p>
              </div>
            </div>

            {comanda.agendamento ? (
              <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                Agendamento vinculado: {formatDateTime(comanda.agendamento.inicio)}
              </div>
            ) : null}
          </div>

          <div className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-5 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-[var(--text)]">
              Itens da comanda
            </h2>

            <div className="space-y-3">
              {comanda.itens.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.tipo === "SERVICO"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-emerald-100 text-emerald-700"
                            }`}
                        >
                          {item.tipo === "SERVICO" ? "Serviço" : "Produto"}
                        </span>

                        <span className="text-sm font-semibold text-[var(--text)]">
                          {item.descricao}
                        </span>
                      </div>

                      <div className="mt-2 grid gap-1 text-sm text-[var(--muted)] md:grid-cols-2">
                        <p>Quantidade: {Number(item.quantidade)}</p>
                        <p>Valor unitário: {money(Number(item.valorUnitario))}</p>
                        <p>Valor total: {money(Number(item.valorTotal))}</p>
                        <p>Profissional: {item.profissional?.nome || "-"}</p>
                      </div>
                    </div>

                    {comanda.status !== "FECHADA" ? (
                      <form action={removerItemComandaAction}>
                        <input type="hidden" name="comandaId" value={comanda.id} />
                        <input type="hidden" name="itemId" value={item.id} />
                        <button
                          type="submit"
                          className="inline-flex h-10 items-center justify-center rounded-xl border border-red-700 bg-red-700 px-4 text-sm font-semibold text-white transition hover:bg-red-800"
                        >
                          Excluir
                        </button>
                      </form>
                    ) : null}
                  </div>
                </div>
              ))}

              {!comanda.itens.length ? (
                <div className="rounded-2xl border border-dashed border-[var(--line)] px-4 py-8 text-center text-sm text-[var(--muted)]">
                  Nenhum item na comanda.
                </div>
              ) : null}
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-5 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-[var(--text)]">
              Pagamentos
            </h2>

            <div className="space-y-3">
              {comanda.pagamentos.map((pagamento) => (
                <div
                  key={pagamento.id}
                  className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-700">
                          {pagamento.metodo}
                        </span>
                        <span className="text-sm font-semibold text-[var(--text)]">
                          {money(Number(pagamento.valor))}
                        </span>
                      </div>

                      <div className="mt-2 text-sm text-[var(--muted)]">
                        <p>Pago em: {formatDateTime(pagamento.pagoEm)}</p>
                        {pagamento.observacoes ? (
                          <p>Obs.: {pagamento.observacoes}</p>
                        ) : null}
                      </div>
                    </div>

                    {comanda.status !== "FECHADA" ? (
                      <form action={removerPagamentoComandaAction}>
                        <input type="hidden" name="comandaId" value={comanda.id} />
                        <input type="hidden" name="pagamentoId" value={pagamento.id} />
                        <button
                          type="submit"
                          className="inline-flex h-10 items-center justify-center rounded-xl border border-red-700 bg-red-700 px-4 text-sm font-semibold text-white transition hover:bg-red-800"
                        >
                          Excluir
                        </button>
                      </form>
                    ) : null}
                  </div>
                </div>
              ))}

              {!comanda.pagamentos.length ? (
                <div className="rounded-2xl border border-dashed border-[var(--line)] px-4 py-8 text-center text-sm text-[var(--muted)]">
                  Nenhum pagamento lançado.
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {comanda.status !== "FECHADA" ? (
            <>
              <div className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-5 shadow-sm">
                <h2 className="mb-4 text-base font-semibold text-[var(--text)]">
                  Adicionar serviço
                </h2>

                <form action={adicionarServicoComandaAction} className="space-y-4">
                  <input type="hidden" name="comandaId" value={comanda.id} />

                  <div>
                    <label className="mb-1 block text-sm font-medium text-[var(--text)]">
                      Serviço
                    </label>
                    <select
                      name="servicoId"
                      className="w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2.5 text-sm"
                      required
                    >
                      <option value="">Selecione</option>
                      {servicos.map((servico) => (
                        <option key={servico.id} value={servico.id}>
                          {servico.nome} — {money(Number(servico.preco))}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-[var(--text)]">
                      Profissional
                    </label>
                    <select
                      name="profissionalId"
                      defaultValue={comanda.profissionalPrincipalId || ""}
                      className="w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2.5 text-sm"
                    >
                      <option value="">Usar principal</option>
                      {profissionais.map((profissional) => (
                        <option key={profissional.id} value={profissional.id}>
                          {profissional.nome}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-900 bg-slate-900 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
                  >
                    Adicionar serviço
                  </button>
                </form>
              </div>

              <div className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-5 shadow-sm">
                <h2 className="mb-4 text-base font-semibold text-[var(--text)]">
                  Adicionar produto
                </h2>

                <form action={adicionarProdutoComandaAction} className="space-y-4">
                  <input type="hidden" name="comandaId" value={comanda.id} />

                  <div>
                    <label className="mb-1 block text-sm font-medium text-[var(--text)]">
                      Produto
                    </label>
                    <select
                      name="produtoId"
                      className="w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2.5 text-sm"
                      required
                    >
                      <option value="">Selecione</option>
                      {produtos.map((produto) => (
                        <option key={produto.id} value={produto.id}>
                          {produto.nome} — {money(Number(produto.preco))} — saldo {produto.estoqueAtual} {produto.unidade}
                        </option>
                      ))}
                    </select>
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
                      className="w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2.5 text-sm"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-900 bg-slate-900 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
                  >
                    Adicionar produto
                  </button>
                </form>
              </div>

              <div className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-5 shadow-sm">
                <h2 className="mb-4 text-base font-semibold text-[var(--text)]">
                  Resumo da comanda
                </h2>

                <form action={atualizarResumoComandaAction} className="space-y-4">
                  <input type="hidden" name="comandaId" value={comanda.id} />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-[var(--text)]">
                        Desconto
                      </label>
                      <input
                        type="number"
                        name="descontoValor"
                        min="0"
                        step="0.01"
                        defaultValue={Number(comanda.descontoValor || 0)}
                        className="w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2.5 text-sm"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-[var(--text)]">
                        Acréscimo
                      </label>
                      <input
                        type="number"
                        name="acrescimoValor"
                        min="0"
                        step="0.01"
                        defaultValue={Number(comanda.acrescimoValor || 0)}
                        className="w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2.5 text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-[var(--text)]">
                      Observações
                    </label>
                    <textarea
                      name="observacoes"
                      rows={3}
                      defaultValue={comanda.observacoes || ""}
                      className="w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2.5 text-sm"
                    />
                  </div>

                  <button
                    type="submit"
                    className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-900 bg-slate-900 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
                  >
                    Atualizar resumo
                  </button>
                </form>
              </div>

              <div className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-5 shadow-sm">
                <h2 className="mb-4 text-base font-semibold text-[var(--text)]">
                  Adicionar pagamento
                </h2>

                <form action={adicionarPagamentoComandaAction} className="space-y-4">
                  <input type="hidden" name="comandaId" value={comanda.id} />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-[var(--text)]">
                        Método
                      </label>
                      <select
                        name="metodo"
                        className="w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2.5 text-sm"
                        required
                      >
                        <option value="DINHEIRO">Dinheiro</option>
                        <option value="PIX">PIX</option>
                        <option value="CARTAO_CREDITO">Cartão crédito</option>
                        <option value="CARTAO_DEBITO">Cartão débito</option>
                        <option value="MISTO">Misto</option>
                        <option value="FIADO">Fiado</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-[var(--text)]">
                        Valor
                      </label>
                      <input
                        type="number"
                        name="valor"
                        min="0.01"
                        step="0.01"
                        defaultValue={restante > 0 ? restante.toFixed(2) : "0.00"}
                        className="w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2.5 text-sm"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-[var(--text)]">
                      Observações
                    </label>
                    <input
                      type="text"
                      name="observacoes"
                      placeholder="Ex.: cartão da máquina 2, fiado para 30 dias..."
                      className="w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2.5 text-sm"
                    />
                  </div>

                  <button
                    type="submit"
                    className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-900 bg-slate-900 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
                  >
                    Adicionar pagamento
                  </button>
                </form>
              </div>
            </>
          ) : null}

          <div className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-5 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-[var(--text)]">
              Totais
            </h2>

            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-[var(--muted)]">Serviços</span>
                <strong className="text-[var(--text)]">
                  {money(Number(comanda.subtotalServicos))}
                </strong>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[var(--muted)]">Produtos</span>
                <strong className="text-[var(--text)]">
                  {money(Number(comanda.subtotalProdutos))}
                </strong>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[var(--muted)]">Desconto</span>
                <strong className="text-[var(--text)]">
                  {money(Number(comanda.descontoValor))}
                </strong>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[var(--muted)]">Acréscimo</span>
                <strong className="text-[var(--text)]">
                  {money(Number(comanda.acrescimoValor))}
                </strong>
              </div>

              <div className="mt-3 border-t border-[var(--line)] pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-[var(--text)]">Total</span>
                  <strong className="text-base text-[var(--text)]">
                    {money(Number(comanda.total))}
                  </strong>
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[var(--muted)]">Pago</span>
                  <strong className="text-[var(--text)]">{money(totalPago)}</strong>
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[var(--muted)]">Restante</span>
                  <strong
                    className={
                      restante <= 0 ? "text-emerald-700" : "text-amber-700"
                    }
                  >
                    {money(restante)}
                  </strong>
                </div>
              </div>
            </div>

            {comanda.status !== "FECHADA" ? (
              <form action={finalizarComandaAction} className="mt-5">
                <input type="hidden" name="comandaId" value={comanda.id} />
                <button
                  type="submit"
                  className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-emerald-700 bg-emerald-700 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800"
                >
                  Finalizar comanda
                </button>
              </form>
            ) : (
              <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                Comanda fechada em {formatDateTime(comanda.fechadaEm)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}