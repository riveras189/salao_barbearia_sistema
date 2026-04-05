import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { FileDown, Users } from "lucide-react";
import { getRelatorioServicosProfissionais } from "@/lib/reports/getRelatorioServicosProfissionais";

export const metadata = {
  title: "Relatório de Serviços por Profissional",
};

const ui = {
  page: "space-y-6 text-[var(--text)]",
  hero: "relative overflow-hidden rounded-[2rem] border border-[var(--line)] bg-[var(--card)] p-8 shadow-sm flex flex-col md:flex-row md:items-end md:justify-between gap-6",
  card: "rounded-[2rem] border border-[var(--line)] bg-[var(--card)] p-6 shadow-sm",
  title: "text-[var(--text)] font-semibold",
  muted: "text-[var(--muted)]",
  statValue: "mt-4 text-3xl font-bold text-[var(--text)] tracking-tight",
  statLabel: "text-sm font-medium text-[var(--muted)]",
  button:
    "inline-flex shrink-0 items-center justify-center rounded-2xl bg-brand font-semibold text-white shadow-sm transition hover:opacity-90 px-5 py-2.5 text-sm",
  buttonOutline:
    "inline-flex items-center justify-center gap-2 rounded-2xl border border-[var(--line)] bg-[var(--card)] px-5 py-2.5 text-sm font-semibold text-[var(--text)] shadow-sm transition hover:bg-[var(--line)] hover:-translate-y-1",
  input: "w-full rounded-2xl border border-[var(--line)] bg-transparent px-4 py-3 text-[var(--text)] focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand",
  label: "block text-sm font-medium text-[var(--muted)] mb-1.5",
  table: "w-full text-left text-sm",
  th: "border-b border-[var(--line-2)] pb-3 font-semibold text-[var(--muted)] px-4",
  td: "border-b border-[var(--line-2)] py-4 text-[var(--text)] px-4 align-top",
};

interface PageProps {
  searchParams: Promise<{
    inicio?: string;
    fim?: string;
    profissionalId?: string;
    servicoId?: string;
  }>;
}

function dateStrAtDay(d?: Date) {
  if (!d) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default async function ProfissionaisServicosPage({ searchParams }: PageProps) {
  const user = await requireUser();
  const sp = await searchParams;

  const inicioStr = sp.inicio;
  const fimStr = sp.fim;
  const profissionalId = sp.profissionalId;
  const servicoId = sp.servicoId;

  const profissionais = await prisma.profissional.findMany({
    where: { empresaId: user.empresaId, ativo: true },
    select: { id: true, nome: true },
    orderBy: { nome: "asc" },
  });

  const servicos = await prisma.servico.findMany({
    where: { empresaId: user.empresaId, ativo: true },
    select: { id: true, nome: true },
    orderBy: { nome: "asc" },
  });

  const relatorio = await getRelatorioServicosProfissionais({
    empresaId: user.empresaId,
    inicio: inicioStr,
    fim: fimStr,
    profissionalId,
    servicoId,
  });

  const resultados = relatorio.rows;
  const sumQuantidades = relatorio.totalQuantidade;
  const sumValoresTotal = relatorio.totalValor;

  const queryParams = new URLSearchParams();
  if (inicioStr) queryParams.set("inicio", inicioStr);
  if (fimStr) queryParams.set("fim", fimStr);
  if (profissionalId) queryParams.set("profissionalId", profissionalId);
  if (servicoId) queryParams.set("servicoId", servicoId);

  const formatMoney = (val: number) =>
    `R$ ${val.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  return (
    <div className={ui.page + " animate-fade-in"}>
      <section className={ui.hero}>
        <div className="relative z-10 max-w-xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
              <Users className="h-5 w-5" />
            </div>
            <h1 className="text-3xl font-bold font-display text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-400 dark:to-teal-400">
              Serviços por Profissional
            </h1>
          </div>
          <p className={`mt-2 font-medium ${ui.muted}`}>
            Ranking e total de execuções de serviços. Filtre por cortes, químicas, escovas ou veja o total geral agrupado para conferência de caixa.
          </p>
        </div>

        <div className="flex gap-3 relative z-10">
          <a
            href={`/api/relatorios/profissionais-servicos/pdf?${queryParams.toString()}`}
            className={ui.buttonOutline}
            target="_blank"
          >
            <FileDown className="h-4 w-4 text-rose-500" />
            Exportar PDF
          </a>
          <a
            href={`/api/relatorios/profissionais-servicos/excel?${queryParams.toString()}`}
            className={ui.buttonOutline}
            target="_blank"
          >
            <FileDown className="h-4 w-4 text-emerald-500" />
            Exportar Excel
          </a>
        </div>
      </section>

      <form
        action="/relatorios/profissionais-servicos"
        method="GET"
        className={ui.card + " grid grid-cols-1 md:grid-cols-5 gap-4 items-end animate-fade-in-up mt-6"}
        style={{ animationDelay: "0.1s" }}
      >
        <div className="w-full relative z-10">
          <label htmlFor="inicio" className={ui.label}>Data Início</label>
          <input
            type="date"
            id="inicio"
            name="inicio"
            defaultValue={inicioStr ?? dateStrAtDay(relatorio.inicioDate)}
            className={ui.input}
          />
        </div>

        <div className="w-full relative z-10">
          <label htmlFor="fim" className={ui.label}>Data Fim</label>
          <input
            type="date"
            id="fim"
            name="fim"
            defaultValue={fimStr ?? dateStrAtDay(relatorio.fimDate)}
            className={ui.input}
          />
        </div>

        <div className="w-full relative z-10">
          <label htmlFor="profissionalId" className={ui.label}>Profissional</label>
          <select
            id="profissionalId"
            name="profissionalId"
            defaultValue={profissionalId || ""}
            className={ui.input}
          >
            <option value="">Todos</option>
            {profissionais.map((p) => (
              <option key={p.id} value={p.id}>{p.nome}</option>
            ))}
          </select>
        </div>

        <div className="w-full relative z-10">
          <label htmlFor="servicoId" className={ui.label}>Serviço</label>
          <select
            id="servicoId"
            name="servicoId"
            defaultValue={servicoId || ""}
            className={ui.input}
          >
            <option value="">Todos os Serviços</option>
            {servicos.map((s) => (
              <option key={s.id} value={s.id}>{s.nome}</option>
            ))}
          </select>
        </div>

        <div className="w-full relative z-10">
          <button
            type="submit"
            className={ui.button + " w-full pb-[15px] pt-[15px] bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500"}
          >
            Gerar relatório
          </button>
        </div>
      </form>

      <div
        className={ui.card + " overflow-x-auto animate-fade-in-up mt-6"}
        style={{ animationDelay: "0.2s" }}
      >
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4">
          Detalhado (Profissional + Serviço)
        </h3>

        <table className={ui.table}>
          <thead className="bg-[#f3f4f6] dark:bg-slate-800/50">
            <tr>
              <th className={ui.th + " pt-3"}>Profissional</th>
              <th className={ui.th + " pt-3"}>Serviço</th>
              <th className={ui.th + " pt-3 text-center"}>Quantidade</th>
              <th className={ui.th + " pt-3 text-right"}>Valor total</th>
            </tr>
          </thead>

          <tbody>
            {resultados.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-6 text-[var(--muted)]">
                  Nenhum agrupamento encontrado no período.
                </td>
              </tr>
            ) : (
              resultados.map((row, idx) => (
                <tr key={idx} className="hover:bg-[var(--line-2)]/30 transition-colors">
                  <td className={ui.td + " font-medium"}>{row.profissionalNome}</td>
                  <td className={ui.td}>{row.servicoDescricao}</td>
                  <td className={ui.td + " text-center font-medium"}>{row.quantidade}</td>
                  <td className={ui.td + " text-right"}>{formatMoney(row.valorTotal)}</td>
                </tr>
              ))
            )}
          </tbody>

          {resultados.length > 0 && (
            <tfoot className="bg-emerald-50/50 dark:bg-emerald-900/10 font-bold border-t-2 border-emerald-100 dark:border-emerald-800/50 text-emerald-900 dark:text-emerald-100">
              <tr>
                <td className="py-4 px-4 align-top" colSpan={2}>Total geral</td>
                <td className="py-4 px-4 align-top text-center">{sumQuantidades}</td>
                <td className="py-4 px-4 align-top text-right">{formatMoney(sumValoresTotal)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}