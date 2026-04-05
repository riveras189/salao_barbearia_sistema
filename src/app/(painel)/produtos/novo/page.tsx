import Link from "next/link";
import PageHeader from "@/components/layout/PageHeader";
import ProdutoForm from "@/components/produtos/ProdutoForm";
import { createProdutoAction } from "@/actions/produtos";

type PageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function NovoProdutoPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};

  return (
    <div className="space-y-6">
      <Link
        href="/produtos"
        className="inline-flex items-center justify-center rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
      >
        ← Voltar
      </Link>

      <PageHeader
        title="Novo produto"
        description="Cadastre um novo produto com foto, preço e estoque."
      />

      {params.error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {params.error}
        </div>
      ) : null}

      <ProdutoForm
        mode="create"
        action={createProdutoAction}
        cancelHref="/produtos"
      />
    </div>
  );
}