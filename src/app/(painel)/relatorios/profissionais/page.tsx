import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import Link from "next/link";
import { CalendarDays, DollarSign, FileDown, Scissors } from "lucide-react";

export const metadata = {
  title: "Relatório de Comissões e Serviços",
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
  }>;
}

function StatCard({ title, value, icon: Icon, color }: any) {
  return (
    <div className={ui.card + " group flex flex-col justify-between hover:border-fuchsia-500/50 hover:shadow-md transition-all duration-300"}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className={ui.statLabel}>{title}</p>
          <div className={ui.statValue}>{value}</div>
        </div>
        {Icon && (
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3"
            style={{ backgroundColor: `${color}15`, color: color, boxShadow: `0 4px 12px ${color}10` }}
          >
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </div>
  );
}

export default async function ProfissionaisRelatorio({ searchParams }: PageProps) {
  const user = await requireUser();
  const sp = await searchParams; // Wait for resolving

  const inicioStr = sp.inicio;
  const fimStr = sp.fim;
  const profissionalId = sp.profissionalId;

  // Carregar profissionais para o select
  const profissionais = await prisma.profissional.findMany({
    where: { empresaId: user.empresaId, ativo: true },
    select: { id: true, nome: true },
    orderBy: { nome: "asc" }
  });

  let inicioDate: Date | undefined;
  let fimDate: Date | undefined;

  if (inicioStr) {
    inicioDate = new Date(inicioStr + "T00:00:00");
  } else if (inicioStr === undefined) {
    // default to start of current month only if not explicitly cleared
    const now = new Date();
    inicioDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  if (fimStr) {
    fimDate = new Date(fimStr + "T23:59:59.999");
  } else if (fimStr === undefined) {
    const now = new Date();
    fimDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  }

  const where: any = {
    tipo: "SERVICO",
  };

  where.comanda = {
    empresaId: user.empresaId,
    status: "FECHADA",
    fechadaEm: { not: null },
  };

  if (inicioDate || fimDate) {
    where.comanda.fechadaEm = {};
    if (inicioDate) where.comanda.fechadaEm.gte = inicioDate;
    if (fimDate) where.comanda.fechadaEm.lte = fimDate;
  }

  if (profissionalId && profissionalId !== "") {
    where.profissionalId = profissionalId;
  } else {
    where.profissionalId = { not: null };
  }

  const itens = await prisma.comandaItem.findMany({
    where,
    include: {
      profissional: { select: { nome: true } },
      comanda: { select: { fechadaEm: true } },
    },
    orderBy: { comanda: { fechadaEm: "asc" } },
  });

  let totalServicosRealizados = 0;
  let totalFaturamentoServicos = 0;
  let totalComissoes = 0;

  itens.forEach((item) => {
    totalServicosRealizados += 1;
    totalFaturamentoServicos += Number(item.valorTotal) || 0;
    totalComissoes += Number(item.valorComissao) || 0;
  });

  const queryParams = new URLSearchParams();
  if (inicioStr !== undefined) queryParams.set("inicio", inicioStr);
  if (fimStr !== undefined) queryParams.set("fim", fimStr);
  if (profissionalId) queryParams.set("profissionalId", profissionalId);

  const formatMoney = (val: number) => `R$ ${val.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
  const dateStrAtDay = (d: Date | undefined) => d ? d.toISOString().split("T")[0] : "";

  return (
    <div className={ui.page + " animate-fade-in"}>
      <section className={ui.hero}>
        <div className="relative z-10 max-w-xl">
          <h1 className="text-3xl font-bold font-display text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-fuchsia-600 dark:from-violet-400 dark:to-fuchsia-400">
            Relatório de Comissões
          </h1>
          <p className={`mt-2 font-medium ${ui.muted}`}>
            Filtre e analise as movimentações e serviços prestados pelos profissionais do salão, com relatórios detalhados exportáveis para PDF e Excel.
          </p>
        </div>
        <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-brand-gradient opacity-[0.05] blur-[80px] animate-float" />

        <div className="flex gap-3 relative z-10 flex-col sm:flex-row items-start sm:items-center">
          <a
            href="/relatorios/profissionais-servicos"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-brand/40 bg-brand/10 px-5 py-2.5 text-sm font-semibold text-brand shadow-sm transition hover:bg-brand/20 hover:-translate-y-1"
          >
            Ver Relatório Agrupado de Serviços (NOVO) ➔
          </a>
          <div className="flex gap-2">
            <a
              href={`/api/relatorios/comissao/pdf?${queryParams.toString()}`}
              className={ui.buttonOutline}
              target="_blank"
            >
              <FileDown className="h-4 w-4 text-rose-500" />
              PDF
            </a>
            <a
              href={`/api/relatorios/comissao/excel?${queryParams.toString()}`}
              className={ui.buttonOutline}
              target="_blank"
            >
              <FileDown className="h-4 w-4 text-emerald-500" />
              Excel
            </a>
          </div>
        </div>
      </section>

      {/* FILTER FORM */}
      <form
        action="/relatorios/profissionais"
        method="GET"
        className={ui.card + " flex flex-col md:flex-row gap-4 items-end animate-fade-in-up mt-6"}
        style={{ animationDelay: "0.1s" }}
      >
        <div className="flex-1 w-full relative z-10">
          <label htmlFor="inicio" className={ui.label}>Data Início</label>
          <input
            type="date"
            id="inicio"
            name="inicio"
            defaultValue={inicioStr || dateStrAtDay(inicioDate)}
            className={ui.input}
          />
        </div>
        <div className="flex-1 w-full relative z-10">
          <label htmlFor="fim" className={ui.label}>Data Fim</label>
          <input
            type="date"
            id="fim"
            name="fim"
            defaultValue={fimStr || dateStrAtDay(fimDate)}
            className={ui.input}
          />
        </div>
        <div className="flex-[1.5] w-full relative z-10">
          <label htmlFor="profissionalId" className={ui.label}>Profissional</label>
          <select
            id="profissionalId"
            name="profissionalId"
            defaultValue={profissionalId || ""}
            className={ui.input}
          >
            <option value="">Todos os profissionais</option>
            {profissionais.map(p => (
              <option key={p.id} value={p.id}>{p.nome}</option>
            ))}
          </select>
        </div>
        <div className="w-full md:w-auto relative z-10">
          <button type="submit" className={ui.button + " w-full pb-[15px] pt-[15px]"}>
            Filtrar
          </button>
        </div>
      </form>

      {/* STAT CARDS */}
      <div className="grid gap-4 sm:grid-cols-3 animate-fade-in-up mt-6" style={{ animationDelay: "0.2s" }}>
        <StatCard
          title="Qtd. de Serviços Feitos"
          value={String(totalServicosRealizados)}
          icon={Scissors}
          color="#3b82f6"
        />
        <StatCard
          title="Faturamento Bruto"
          value={formatMoney(totalFaturamentoServicos)}
          icon={DollarSign}
          color="#10b981"
        />
        <StatCard
          title="Total de Comissões"
          value={formatMoney(totalComissoes)}
          icon={DollarSign}
          color="#d946ef"
        />
      </div>

      {/* RESULT TABLE */}
      <div className={ui.card + " overflow-x-auto animate-fade-in-up mt-6"} style={{ animationDelay: "0.3s" }}>
        <table className={ui.table}>
          <thead>
            <tr>
              <th className={ui.th}>Data/Hora</th>
              <th className={ui.th}>Profissional</th>
              <th className={ui.th}>Serviço</th>
              <th className={ui.th}>Valor</th>
              <th className={ui.th}>Comissão (%)</th>
              <th className={ui.th}>Total Comissão</th>
            </tr>
          </thead>
          <tbody>
            {itens.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-6 text-[var(--muted)]">Nenhum serviço encontrado no período filtrado.</td>
              </tr>
            ) : (
              itens.map((item) => (
                <tr key={item.id} className="hover:bg-[var(--line-2)]/30 transition-colors">
                  <td className={ui.td}>
                    {item.comanda?.fechadaEm
                      ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(item.comanda.fechadaEm)
                      : "-"}
                  </td>
                  <td className={ui.td + " font-medium"}>
                    {item.profissional?.nome || "Secundário"}
                  </td>
                  <td className={ui.td}>{item.descricao}</td>
                  <td className={ui.td}>{formatMoney(Number(item.valorTotal) || 0)}</td>
                  <td className={ui.td}>
                    <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {Number(item.comissaoPercentual || 0)}%
                    </span>
                  </td>
                  <td className={ui.td + " font-semibold text-emerald-600 dark:text-emerald-400"}>
                    {formatMoney(Number(item.valorComissao) || 0)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
