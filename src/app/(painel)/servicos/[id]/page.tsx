import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import PageHeader from "@/components/layout/PageHeader";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatMoney(value: string) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value || 0));
}

export default async function ServicoDetalhePage({ params }: PageProps) {
  const user = await requireUser();
  const { id } = await params;

  const servico = await prisma.servico.findFirst({
    where: {
      id,
      empresaId: user.empresaId,
    },
    include: {
      categoria: true,
      profissionais: {
        include: {
          profissional: true,
        },
      },
    },
  });

  if (!servico) notFound();

  return (
    <div>
      <PageHeader
        title={servico.nome}
        description="Visualização do cadastro do serviço."
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/servicos"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Voltar
            </Link>

            <Link
              href={`/servicos/${servico.id}/editar`}
              className="inline-flex items-center justify-center rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Editar
            </Link>
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Dados principais</h2>

          <div className="mt-4 space-y-3 text-sm">
            <div>
              <span className="font-semibold text-slate-900">Nome:</span>{" "}
              <span className="text-slate-700">{servico.nome}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-900">Categoria:</span>{" "}
              <span className="text-slate-700">{servico.categoria?.nome || "—"}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-900">Duração:</span>{" "}
              <span className="text-slate-700">{servico.duracaoMin} min</span>
            </div>
            <div>
              <span className="font-semibold text-slate-900">Preço:</span>{" "}
              <span className="text-slate-700">
                {formatMoney(servico.preco.toString())}
              </span>
            </div>
            <div>
              <span className="font-semibold text-slate-900">Comissão:</span>{" "}
              <span className="text-slate-700">
                {Number(servico.comissaoPercentualPadrao.toString()).toLocaleString("pt-BR")}%
              </span>
            </div>
            <div>
              <span className="font-semibold text-slate-900">Exibir no site:</span>{" "}
              <span className="text-slate-700">{servico.exibirNoSite ? "Sim" : "Não"}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-900">Status:</span>{" "}
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${servico.ativo
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-slate-200 text-slate-700"
                  }`}
              >
                {servico.ativo ? "Ativo" : "Inativo"}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Profissionais habilitados</h2>

          {servico.profissionais.length ? (
            <div className="mt-4 space-y-2 text-sm text-slate-700">
              {servico.profissionais.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-200 px-4 py-3"
                >
                  {item.profissional.nome}
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500">
              Nenhum profissional vinculado.
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Descrição</h2>
        <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">
          {servico.descricao || "Nenhuma descrição cadastrada."}
        </p>
      </div>
    </div>
  );
}