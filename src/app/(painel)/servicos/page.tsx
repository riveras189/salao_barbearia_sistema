import Link from "next/link";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import PageHeader from "@/components/layout/PageHeader";
import ServicoTable from "@/components/servicos/ServicoTable";

type PageProps = {
  searchParams?: Promise<{
    q?: string;
    ok?: string;
  }>;
};

export default async function ServicosPage({ searchParams }: PageProps) {
  const user = await requireUser();
  const params = (await searchParams) || {};

  const q = String(params.q || "").trim();
  const ok = String(params.ok || "").trim();

  const where: Prisma.ServicoWhereInput = {
    empresaId: user.empresaId,
  };

  if (q) {
    const qNormalized = q
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    where.OR = [
      { nome: { contains: qNormalized } },
      { descricao: { contains: qNormalized } },
      { categoria: { nome: { contains: qNormalized } } },
    ];
  }

  const servicos = await prisma.servico.findMany({
    where,
    include: {
      categoria: true,
    },
    orderBy: { nome: "asc" },
  });

  return (
    <div>
      <PageHeader
        title="Serviços"
        description="Cadastro de serviços, duração, preço, comissão e profissionais."
        actions={
          <Link
            href="/servicos/novo"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            Novo serviço
          </Link>
        }
      />

      {ok === "created" ? (
        <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Serviço cadastrado com sucesso.
        </div>
      ) : null}

      {ok === "updated" ? (
        <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Serviço atualizado com sucesso.
        </div>
      ) : null}

      <form
        method="get"
        className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Buscar por nome, descrição ou categoria"
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-900"
          />

          <button
            type="submit"
            className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Buscar
          </button>

          <Link
            href="/servicos"
            className="inline-flex items-center justify-center rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Limpar
          </Link>
        </div>
      </form>

      <ServicoTable
        items={servicos.map((item) => ({
          id: item.id,
          nome: item.nome,
          categoria: item.categoria?.nome || null,
          preco: item.preco.toString(),
          duracaoMin: item.duracaoMin,
          comissao: item.comissaoPercentualPadrao.toString(),
          exibirNoSite: item.exibirNoSite,
          ativo: item.ativo,
        }))}
      />
    </div>
  );
}
