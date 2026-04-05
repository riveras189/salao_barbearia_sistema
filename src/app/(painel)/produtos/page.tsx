import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import PageHeader from "@/components/layout/PageHeader";

type PageProps = {
  searchParams?: Promise<{
    q?: string;
    ok?: string;
    error?: string;
  }>;
};

function money(value: number | string) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default async function ProdutosPage({ searchParams }: PageProps) {
  const user = await requireUser();
  const params = (await searchParams) ?? {};
  const q = String(params.q ?? "").trim();

  const qNormalized = q
    ? q
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
    : '';

  const produtos = await prisma.produto.findMany({
    where: {
      empresaId: user.empresaId,
      ...(qNormalized
        ? {
            OR: [
              { nome: { contains: qNormalized, mode: "insensitive" } },
              { marca: { contains: qNormalized, mode: "insensitive" } },
              { codigoBarras: { contains: qNormalized, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { nome: "asc" },
  });

  return (
    <div className="space-y-6">
    

      <PageHeader
        title="Produtos"
        description="Cadastre e gerencie os produtos do sistema."
      />

      {params.ok ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {params.ok === "created" && "Produto cadastrado com sucesso."}
          {params.ok === "updated" && "Produto atualizado com sucesso."}
        </div>
      ) : null}

      {params.error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {params.error}
        </div>
      ) : null}

      <div className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <form className="flex w-full gap-3 md:max-w-xl">
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Buscar por nome, marca ou código..."
              className="h-11 flex-1 rounded-xl border border-[var(--line)] bg-white px-3 text-sm outline-none transition focus:border-[var(--primary)]"
            />
            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-[var(--line)] px-4 text-sm font-semibold text-[var(--text)] transition hover:bg-[var(--soft)]"
            >
              Buscar
            </button>
          </form>

          <Link
            href="/produtos/novo"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            Novo produto
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {produtos.map((produto) => {
          const baixo = (produto.estoqueAtual ?? 0) <= (produto.estoqueMinimo ?? 0);

          return (
            <div
              key={produto.id}
              className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--card)] shadow-sm"
            >
              <div className="flex items-start gap-4 p-4">
                {produto.fotoUrl ? (
                  <img
                    src={produto.fotoUrl}
                    alt={produto.nome}
                    className="h-24 w-24 rounded-2xl border border-[var(--line)] object-cover"
                  />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-2xl border border-dashed border-[var(--line)] bg-[var(--soft)] text-xs text-[var(--muted)]">
                    Sem foto
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-base font-semibold text-[var(--text)]">
                      {produto.nome}
                    </h3>

                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        baixo
                          ? "bg-amber-100 text-amber-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {baixo ? "Estoque baixo" : "Em estoque"}
                    </span>

                    {!produto.ativo ? (
                      <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-700">
                        Inativo
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-2 space-y-1 text-sm text-[var(--muted)]">
                    <p>Marca: {produto.marca || "-"}</p>
                    <p>Preço: {money(Number(produto.preco))}</p>
                    <p>Custo: {money(Number(produto.custo))}</p>
                    <p>
                      Estoque:{" "}
                      <span className="font-semibold text-[var(--text)]">
                        {produto.estoqueAtual}
                      </span>{" "}
                      | Mínimo: {produto.estoqueMinimo}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 border-t border-[var(--line)] p-4">
                <Link
                  href={`/produtos/${produto.id}/editar`}
                  className="inline-flex h-10 items-center justify-center rounded-xl border border-[var(--line)] px-4 text-sm font-semibold text-[var(--text)] transition hover:bg-[var(--soft)]"
                >
                  Editar
                </Link>

                <Link
                  href={`/estoque?produtoId=${produto.id}`}
                 className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                >
                  Movimentar estoque
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {!produtos.length ? (
        <div className="rounded-2xl border border-dashed border-[var(--line)] bg-[var(--card)] px-6 py-10 text-center text-sm text-[var(--muted)]">
          Nenhum produto encontrado.
        </div>
      ) : null}
    </div>
  );
}