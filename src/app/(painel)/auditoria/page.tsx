import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

const ui = {
  page: "space-y-6 p-1 text-[var(--text)]",
  hero: "rounded-3xl border border-[var(--line)] bg-[var(--card)] p-6 shadow-sm",
  card: "rounded-3xl border border-[var(--line)] bg-[var(--card)] p-5 shadow-sm",
  soft: "rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4",
  title: "text-[var(--text)]",
  muted: "text-[var(--muted)]",
  label: "mb-1.5 block text-sm font-medium text-[var(--text)]",
  input:
    "w-full rounded-2xl border border-slate-400 bg-[var(--card)] px-4 py-3 text-sm text-[var(--text)] outline-none transition placeholder:text-[var(--muted)] focus:border-slate-700 dark:border-[var(--line)] dark:focus:border-white",
  primaryButton:
    "inline-flex items-center justify-center rounded-2xl border px-4 py-2.5 text-sm font-semibold shadow-sm transition",
  link:
    "inline-flex items-center justify-center rounded-2xl border px-4 py-2.5 text-sm font-semibold shadow-sm transition",
  badge:
    "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
  success:
    "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
  warn:
    "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
  danger:
    "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
  code:
    "overflow-x-auto rounded-2xl border border-[var(--line)] bg-slate-950 p-4 text-xs text-slate-100",
};

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = params[key];
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function formatDateTime(value: Date | string | null | undefined) {
  if (!value) return "-";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatDateInputEnd(dateText: string) {
  if (!dateText) return null;
  const date = new Date(`${dateText}T23:59:59.999`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDateInputStart(dateText: string) {
  if (!dateText) return null;
  const date = new Date(`${dateText}T00:00:00.000`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function jsonToPretty(value: unknown) {
  if (value == null) return "";
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function normalizeText(value: string) {
  return value.trim();
}

function getActionBadgeClass(acao: string) {
  const value = acao.toUpperCase();

  if (
    value.includes("DELETE") ||
    value.includes("EXCLUIR") ||
    value.includes("REMOVE") ||
    value.includes("CANCEL")
  ) {
    return ui.danger;
  }

  if (
    value.includes("CREATE") ||
    value.includes("CRIAR") ||
    value.includes("INSERT") ||
    value.includes("CADASTRAR")
  ) {
    return ui.success;
  }

  if (
    value.includes("UPDATE") ||
    value.includes("EDIT") ||
    value.includes("ALTER") ||
    value.includes("ATUALIZ")
  ) {
    return ui.warn;
  }

  return ui.badge;
}

export default async function AuditoriaPage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {};

  const user = await requireUser().catch(() => null);
  if (!user) redirect("/login");

  const q = normalizeText(getParam(params, "q"));
  const entidade = normalizeText(getParam(params, "entidade"));
  const acao = normalizeText(getParam(params, "acao"));
  const usuarioBusca = normalizeText(getParam(params, "usuario"));
  const de = normalizeText(getParam(params, "de"));
  const ate = normalizeText(getParam(params, "ate"));

  const dataInicio = formatDateInputStart(de);
  const dataFim = formatDateInputEnd(ate);

  const where: any = {
    empresaId: user.empresaId,
  };

  if (q) {
    where.OR = [
      { entidade: { contains: q, mode: "insensitive" } },
      { entidadeId: { contains: q, mode: "insensitive" } },
      { acao: { contains: q, mode: "insensitive" } },
      { ip: { contains: q, mode: "insensitive" } },
      { userAgent: { contains: q, mode: "insensitive" } },
      {
        usuario: {
          is: {
            nome: { contains: q, mode: "insensitive" },
          },
        },
      },
      {
        usuario: {
          is: {
            login: { contains: q, mode: "insensitive" },
          },
        },
      },
    ];
  }

  if (entidade) {
    where.entidade = { contains: entidade, mode: "insensitive" };
  }

  if (acao) {
    where.acao = { contains: acao, mode: "insensitive" };
  }

  if (usuarioBusca) {
    where.usuario = {
      is: {
        OR: [
          { nome: { contains: usuarioBusca, mode: "insensitive" } },
          { login: { contains: usuarioBusca, mode: "insensitive" } },
        ],
      },
    };
  }

  if (dataInicio || dataFim) {
    where.createdAt = {};
    if (dataInicio) where.createdAt.gte = dataInicio;
    if (dataFim) where.createdAt.lte = dataFim;
  }

  const [logs, totalLogs, logsHoje, logsRecentes, entidadesRaw, acoesRaw] =
    await Promise.all([
      prisma.auditoriaLog.findMany({
        where,
        include: {
          usuario: {
            select: {
              nome: true,
              login: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 100,
      }),

      prisma.auditoriaLog.count({
        where: {
          empresaId: user.empresaId,
        },
      }),

      prisma.auditoriaLog.count({
        where: {
          empresaId: user.empresaId,
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lte: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
      }),

      prisma.auditoriaLog.findMany({
        where: {
          empresaId: user.empresaId,
        },
        select: {
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      }),

      prisma.auditoriaLog.findMany({
        where: {
          empresaId: user.empresaId,
        },
        select: {
          entidade: true,
        },
        distinct: ["entidade"],
        orderBy: {
          entidade: "asc",
        },
      }),

      prisma.auditoriaLog.findMany({
        where: {
          empresaId: user.empresaId,
        },
        select: {
          acao: true,
        },
        distinct: ["acao"],
        orderBy: {
          acao: "asc",
        },
      }),
    ]);

  const entidades = entidadesRaw.map((item) => item.entidade).filter(Boolean);
  const acoes = acoesRaw.map((item) => item.acao).filter(Boolean);

  return (
    <div className={ui.page}>
      <section className={ui.hero}>
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className={`text-2xl font-bold ${ui.title}`}>Auditoria</h1>
            <p className={`mt-2 text-sm ${ui.muted}`}>
              Histórico de ações do sistema por usuário, entidade e data.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard"
              className={ui.link}
              style={{
                borderColor: "var(--line)",
                background: "var(--card)",
                color: "var(--text)",
              }}
            >
              Voltar ao dashboard
            </Link>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className={ui.card}>
          <p className={ui.muted}>Total de logs</p>
          <p className="mt-3 text-4xl font-bold text-[var(--text)]">
            {totalLogs}
          </p>
        </div>

        <div className={ui.card}>
          <p className={ui.muted}>Logs de hoje</p>
          <p className="mt-3 text-4xl font-bold text-[var(--text)]">
            {logsHoje}
          </p>
        </div>

        <div className={ui.card}>
          <p className={ui.muted}>Resultado do filtro</p>
          <p className="mt-3 text-4xl font-bold text-[var(--text)]">
            {logs.length}
          </p>
        </div>

        <div className={ui.card}>
          <p className={ui.muted}>Último registro</p>
          <p className="mt-3 text-base font-semibold text-[var(--text)]">
            {logsRecentes[0]?.createdAt
              ? formatDateTime(logsRecentes[0].createdAt)
              : "Sem registros"}
          </p>
        </div>
      </div>

      <section className={ui.card}>
        <h2 className={`text-xl font-bold ${ui.title}`}>Filtros</h2>

        <form className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <label className="block xl:col-span-2">
            <span className={ui.label}>Busca geral</span>
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="entidade, ação, id, IP, usuário..."
              className={ui.input}
            />
          </label>

          <label className="block">
            <span className={ui.label}>Entidade</span>
            <input
              type="text"
              name="entidade"
              list="auditoria-entidades"
              defaultValue={entidade}
              placeholder="Ex.: Cliente"
              className={ui.input}
            />
            <datalist id="auditoria-entidades">
              {entidades.map((item) => (
                <option key={item} value={item} />
              ))}
            </datalist>
          </label>

          <label className="block">
            <span className={ui.label}>Ação</span>
            <input
              type="text"
              name="acao"
              list="auditoria-acoes"
              defaultValue={acao}
              placeholder="Ex.: UPDATE"
              className={ui.input}
            />
            <datalist id="auditoria-acoes">
              {acoes.map((item) => (
                <option key={item} value={item} />
              ))}
            </datalist>
          </label>

          <label className="block">
            <span className={ui.label}>Usuário</span>
            <input
              type="text"
              name="usuario"
              defaultValue={usuarioBusca}
              placeholder="Nome ou login"
              className={ui.input}
            />
          </label>

          <label className="block">
            <span className={ui.label}>De</span>
            <input
              type="date"
              name="de"
              defaultValue={de}
              className={ui.input}
            />
          </label>

          <label className="block">
            <span className={ui.label}>Até</span>
            <input
              type="date"
              name="ate"
              defaultValue={ate}
              className={ui.input}
            />
          </label>

          <div className="flex flex-wrap items-end gap-3 xl:col-span-6">
            <button
              type="submit"
              className={ui.primaryButton}
              style={{
                borderColor: "color-mix(in srgb, var(--brand-color) 30%, var(--line))",
                background: "var(--brand-gradient)",
                color: "#fff",
              }}
            >
              Filtrar
            </button>

            <Link
              href="/auditoria"
              className={ui.link}
              style={{
                borderColor: "var(--line)",
                background: "var(--card)",
                color: "var(--text)",
              }}
            >
              Limpar filtros
            </Link>
          </div>
        </form>
      </section>

      <section className={ui.card}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className={`text-xl font-bold ${ui.title}`}>Registros</h2>
            <p className={`mt-1 text-sm ${ui.muted}`}>
              Últimos 100 registros encontrados.
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-4">
          {logs.length === 0 ? (
            <div className={ui.soft}>
              <p className={ui.muted}>Nenhum registro de auditoria encontrado.</p>
            </div>
          ) : (
            logs.map((log) => {
              const usuarioNome =
                log.usuario?.nome || log.usuario?.login || "Sistema";

              const dadosAntes = jsonToPretty(log.dadosAntes);
              const dadosDepois = jsonToPretty(log.dadosDepois);

              return (
                <article key={log.id} className={ui.soft}>
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={ui.badge}
                          style={{
                            borderColor: "color-mix(in srgb, var(--line) 70%, var(--brand-color) 30%)",
                            background: "var(--card-2)",
                            color: "var(--text)",
                          }}
                        >
                          {log.entidade}
                        </span>
                        <span
                          className={getActionBadgeClass(log.acao)}
                          style={
                            log.acao.toUpperCase().includes("DELETE") ||
                            log.acao.toUpperCase().includes("EXCLUIR") ||
                            log.acao.toUpperCase().includes("REMOVE") ||
                            log.acao.toUpperCase().includes("CANCEL")
                              ? {
                                  borderColor: "rgba(225, 29, 72, 0.28)",
                                  background: "rgba(225, 29, 72, 0.12)",
                                  color: "rgb(190, 24, 93)",
                                }
                              : log.acao.toUpperCase().includes("CREATE") ||
                                  log.acao.toUpperCase().includes("CRIAR") ||
                                  log.acao.toUpperCase().includes("INSERT") ||
                                  log.acao.toUpperCase().includes("CADASTRAR")
                                ? {
                                    borderColor: "rgba(5, 150, 105, 0.28)",
                                    background: "rgba(5, 150, 105, 0.12)",
                                    color: "rgb(4, 120, 87)",
                                  }
                                : log.acao.toUpperCase().includes("UPDATE") ||
                                    log.acao.toUpperCase().includes("EDIT") ||
                                    log.acao.toUpperCase().includes("ALTER") ||
                                    log.acao.toUpperCase().includes("ATUALIZ")
                                  ? {
                                      borderColor: "rgba(217, 119, 6, 0.28)",
                                      background: "rgba(217, 119, 6, 0.12)",
                                      color: "rgb(180, 83, 9)",
                                    }
                                  : {
                                      borderColor: "color-mix(in srgb, var(--line) 70%, var(--brand-color) 30%)",
                                      background: "var(--card-2)",
                                      color: "var(--text)",
                                    }
                          }
                        >
                          {log.acao}
                        </span>
                        <span
                          className={ui.badge}
                          style={{
                            borderColor: "color-mix(in srgb, var(--line) 70%, var(--brand-color) 30%)",
                            background: "var(--card-2)",
                            color: "var(--text)",
                          }}
                        >
                          ID: {log.entidadeId || "-"}
                        </span>
                      </div>

                      <p className={`text-sm ${ui.muted}`}>
                        <strong className={ui.title}>Usuário:</strong>{" "}
                        {usuarioNome}
                      </p>

                      <p className={`text-sm ${ui.muted}`}>
                        <strong className={ui.title}>Data:</strong>{" "}
                        {formatDateTime(log.createdAt)}
                      </p>

                      <div className="flex flex-wrap gap-4">
                        <p className={`text-sm ${ui.muted}`}>
                          <strong className={ui.title}>IP:</strong>{" "}
                          {log.ip || "-"}
                        </p>

                        <p className={`text-sm ${ui.muted}`}>
                          <strong className={ui.title}>User Agent:</strong>{" "}
                          {log.userAgent || "-"}
                        </p>
                      </div>
                    </div>

                    <div className="text-xs text-[var(--muted)]">
                      <span
                        className={ui.badge}
                        style={{
                          borderColor: "color-mix(in srgb, var(--line) 70%, var(--brand-color) 30%)",
                          background: "var(--card-2)",
                          color: "var(--text)",
                        }}
                      >
                        {log.id}
                      </span>
                    </div>
                  </div>

                  {(dadosAntes || dadosDepois) && (
                    <div className="mt-4 grid gap-4 xl:grid-cols-2">
                      <div>
                        <p className={`mb-2 text-sm font-semibold ${ui.title}`}>
                          Dados antes
                        </p>
                        {dadosAntes ? (
                          <pre className={ui.code}>{dadosAntes}</pre>
                        ) : (
                          <div className={ui.soft}>
                            <p className={ui.muted}>Sem dados anteriores.</p>
                          </div>
                        )}
                      </div>

                      <div>
                        <p className={`mb-2 text-sm font-semibold ${ui.title}`}>
                          Dados depois
                        </p>
                        {dadosDepois ? (
                          <pre className={ui.code}>{dadosDepois}</pre>
                        ) : (
                          <div className={ui.soft}>
                            <p className={ui.muted}>Sem dados posteriores.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </article>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
