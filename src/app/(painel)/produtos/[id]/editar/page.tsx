import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import PageHeader from "@/components/layout/PageHeader";
import ProdutoForm from "@/components/produtos/ProdutoForm";
import { updateProdutoAction } from "@/actions/produtos";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function EditarProdutoPage({
  params,
  searchParams,
}: PageProps) {
  const user = await requireUser();
  const { id } = await params;
  const qs = (await searchParams) ?? {};

  const produto = await prisma.produto.findFirst({
    where: {
      id,
      empresaId: user.empresaId,
    },
  });

  if (!produto) notFound();

  return (
    <div className="space-y-6">
      <Link
        href="/produtos"
        className="inline-flex items-center justify-center rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
      >
        ← Voltar
      </Link>

      <PageHeader
        title="Editar produto"
        description={`Atualize os dados de ${produto.nome}.`}
      />

      {qs.error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {qs.error}
        </div>
      ) : null}

      <ProdutoForm
        mode="edit"
        action={updateProdutoAction}
        cancelHref="/produtos"
        produto={{
          id: produto.id,
          nome: produto.nome,
          descricao: produto.descricao,
          categoria: null,
          marca: produto.marca,
          codigoBarras: produto.codigoBarras,
          unidade: produto.unidade,
          custo: Number(produto.custo).toFixed(2),
          preco: Number(produto.preco).toFixed(2),
          estoqueAtual: produto.estoqueAtual,
          estoqueMinimo: produto.estoqueMinimo,
          fotoUrl: produto.fotoUrl,
          ativo: produto.ativo,
        }}
      />
    </div>
  );
}