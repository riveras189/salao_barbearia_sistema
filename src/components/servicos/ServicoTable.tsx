import Link from "next/link";
import { toggleServicoAtivo } from "@/actions/servicos";

type ServicoTableItem = {
  id: string;
  nome: string;
  categoria: string | null;
  preco: string;
  duracaoMin: number;
  comissao: string;
  exibirNoSite: boolean;
  ativo: boolean;
};

type Props = {
  items: ServicoTableItem[];
};

function formatMoney(value: string) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value || 0));
}

export default function ServicoTable({ items }: Props) {
  if (!items.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">
          Nenhum serviço encontrado
        </h3>
        <p className="mt-2 text-sm text-slate-500">
          Cadastre o primeiro serviço ou ajuste o filtro da pesquisa.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-700">
                Serviço
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-700">
                Categoria
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-700">
                Duração
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-700">
                Preço
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-700">
                Comissão
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-700">
                Site
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-700">
                Status
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-700">
                Ações
              </th>
            </tr>
          </thead>

          <tbody>
            {items.map((servico) => (
              <tr key={servico.id} className="border-t border-slate-200">
                <td className="px-4 py-4">
                  <div className="font-semibold text-slate-900">{servico.nome}</div>
                </td>

                <td className="px-4 py-4 text-sm text-slate-700">
                  {servico.categoria || "—"}
                </td>

                <td className="px-4 py-4 text-sm text-slate-700">
                  {servico.duracaoMin} min
                </td>

                <td className="px-4 py-4 text-sm text-slate-700">
                  {formatMoney(servico.preco)}
                </td>

                <td className="px-4 py-4 text-sm text-slate-700">
                  {Number(servico.comissao || 0).toLocaleString("pt-BR")}%
                </td>

                <td className="px-4 py-4">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                      servico.exibirNoSite
                        ? "bg-blue-100 text-blue-700"
                        : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {servico.exibirNoSite ? "Sim" : "Não"}
                  </span>
                </td>

                <td className="px-4 py-4">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                      servico.ativo
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {servico.ativo ? "Ativo" : "Inativo"}
                  </span>
                </td>

                <td className="px-4 py-4">
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <Link
                      href={`/servicos/${servico.id}`}
                      className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      Ver
                    </Link>

                    <Link
                      href={`/servicos/${servico.id}/editar`}
                      className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      Editar
                    </Link>

                    <form action={toggleServicoAtivo}>
                      <input type="hidden" name="id" value={servico.id} />
                      <button
                        type="submit"
                        className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        {servico.ativo ? "Inativar" : "Ativar"}
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}