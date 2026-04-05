import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getReportFilters } from "@/lib/reports/filters";
import { getReportData } from "@/lib/reports";
import type { ReportTipo } from "@/lib/reports/types";

const TIPOS = new Set<ReportTipo>([
  "clientes",
  "profissionais",
  "vendas",
  "estoque",
  "financeiro",
]);

type PageProps = {
  params: Promise<{ tipo: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function RelatorioTipoPage({
  params,
  searchParams,
}: PageProps) {
  const user = await requireUser();
  const { tipo } = await params;
  const search = await searchParams;

  if (!TIPOS.has(tipo as ReportTipo)) notFound();

  const filters = getReportFilters(search);
  const report = await getReportData(tipo as ReportTipo, filters, user.empresaId);

  const query = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) query.set(key, String(value));
  });

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              {report.title}
            </h1>
            <p className="mt-2 text-sm text-slate-600">{report.subtitle}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href={`/api/relatorios/${tipo}/pdf?${query.toString()}`}
              target="_blank"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
            >
              Exportar PDF
            </Link>

            <Link
              href={`/api/relatorios/${tipo}/excel?${query.toString()}`}
              className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
            >
              Exportar Excel
            </Link>
          </div>
        </div>
      </div>

      <form className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Dia
            </label>
            <input
              type="date"
              name="dia"
              defaultValue={filters.dia || ""}
              className="h-12 w-full rounded-2xl border border-slate-300 px-4 text-sm text-slate-900 outline-none transition focus:border-slate-900"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              De
            </label>
            <input
              type="date"
              name="de"
              defaultValue={filters.de || ""}
              className="h-12 w-full rounded-2xl border border-slate-300 px-4 text-sm text-slate-900 outline-none transition focus:border-slate-900"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Até
            </label>
            <input
              type="date"
              name="ate"
              defaultValue={filters.ate || ""}
              className="h-12 w-full rounded-2xl border border-slate-300 px-4 text-sm text-slate-900 outline-none transition focus:border-slate-900"
            />
          </div>

          <div className="xl:col-span-1">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Buscar
            </label>
            <input
              type="text"
              name="q"
              placeholder="Nome, telefone, e-mail..."
              defaultValue={filters.q || ""}
              className="h-12 w-full rounded-2xl border border-slate-300 px-4 text-sm text-slate-900 outline-none transition focus:border-slate-900"
            />
          </div>

          <div className="flex items-end">
            <button
             className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
            >
              Filtrar
            </button>
          </div>
        </div>
      </form>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {report.summary.map((card) => (
          <div
            key={card.label}
            className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-sm font-medium text-slate-700">{card.label}</p>
            <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                {report.columns.map((col) => (
                  <th
                    key={col.key}
                    className={`border-b border-slate-200 px-4 py-4 font-semibold text-slate-900 ${
                      col.align === "right"
                        ? "text-right"
                        : col.align === "center"
                        ? "text-center"
                        : "text-left"
                    }`}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {report.rows.map((row, index) => (
                <tr
                  key={index}
                  className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}
                >
                  {report.columns.map((col) => (
                    <td
                      key={col.key}
                      className={`border-b border-slate-100 px-4 py-4 text-slate-700 ${
                        col.align === "right"
                          ? "text-right"
                          : col.align === "center"
                          ? "text-center"
                          : "text-left"
                      }`}
                    >
                      {String((row as any)[col.key] ?? "")}
                    </td>
                  ))}
                </tr>
              ))}

              {report.rows.length === 0 && (
                <tr>
                  <td
                    colSpan={report.columns.length}
                    className="px-4 py-12 text-center text-sm text-slate-700"
                  >
                    Nenhum registro encontrado para os filtros informados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-xs text-slate-700">
        Gerado em {new Date(report.generatedAt).toLocaleString("pt-BR")}
      </div>
    </div>
  );
}