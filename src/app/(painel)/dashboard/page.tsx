import Link from "next/link";
import { redirect } from "next/navigation";
import {
  StatusAgendamento,
  StatusComanda,
  TipoCaixaMovimento,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { CalendarDays, Receipt, Landmark, Package, Cake, Users, Scissors, FileWarning } from "lucide-react";

const ui = {
  page: "space-y-6 text-[var(--text)]",
  hero: "relative overflow-hidden rounded-[2rem] border border-[var(--line)] bg-[var(--card)] p-8 shadow-sm",
  card: "rounded-[2rem] border border-[var(--line)] bg-[var(--card)] p-6 shadow-sm",
  soft: "rounded-2xl border border-[var(--line-2)] bg-[var(--card-2)] p-4 transition-all hover:border-[var(--line)] hover:shadow-sm",
  title: "text-[var(--text)] font-semibold",
  muted: "text-[var(--muted)]",
  statValue: "mt-4 text-3xl font-bold text-[var(--text)] tracking-tight",
  statLabel: "text-sm font-medium text-[var(--muted)]",
  button:
    "inline-flex items-center justify-center rounded-2xl bg-brand font-semibold text-white shadow-sm transition hover:opacity-90 px-4 py-2.5 text-sm",
  link:
    "inline-flex items-center justify-center rounded-xl bg-[var(--card-2)] border border-[var(--line)] px-4 py-2 text-sm font-semibold text-[var(--text)] shadow-sm transition hover:bg-[var(--line)]",
  ok: "rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-600 dark:text-emerald-400",
  warn: "rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm font-medium text-amber-600 dark:text-amber-400",
  birthday:
    "rounded-2xl border border-fuchsia-500/20 bg-fuchsia-500/10 px-4 py-3 text-sm font-medium text-fuchsia-600 dark:text-fuchsia-400 flex items-center gap-2",
};

function toNumber(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value) || 0;
  if (value && typeof value === "object" && "toNumber" in (value as any)) {
    try {
      return (value as any).toNumber();
    } catch {
      return Number(String(value)) || 0;
    }
  }
  return Number(value ?? 0) || 0;
}

function formatMoney(value: unknown) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(toNumber(value));
}

function formatHour(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatDateBR(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  }).format(date);
}

function startAndEndOfToday() {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  return { now, start, end };
}

function StatCard({
  title,
  value,
  href,
  helper,
  icon: Icon,
  color,
}: {
  title: string;
  value: string;
  href?: string;
  helper?: string;
  icon?: any;
  color?: string;
}) {
  const content = (
    <div className={ui.card + " group flex flex-col justify-between h-full hover:border-fuchsia-500/50 hover:shadow-md transition-all duration-300"}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className={ui.statLabel}>{title}</p>
          <div className={ui.statValue}>{value}</div>
          {helper ? <p className={`mt-2 text-xs opacity-75 ${ui.muted}`}>{helper}</p> : null}
        </div>
        {Icon && (
          <div 
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3"
            style={{ 
               backgroundColor: `${color}15`,
               color: color,
               boxShadow: `0 4px 12px ${color}10`
            }}
          >
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </div>
  );

  if (!href) return content;

  return (
    <Link href={href} className="block transition hover:-translate-y-1 h-full">
      {content}
    </Link>
  );
}

function getBirthdayParts(date: Date) {
  return {
    month: date.getUTCMonth(),
    day: date.getUTCDate(),
  };
}

function getNextBirthdayDate(birthDate: Date, reference: Date) {
  const { month, day } = getBirthdayParts(birthDate);

  let candidate = new Date(
    reference.getFullYear(),
    month,
    day,
    12,
    0,
    0,
    0,
  );

  if (
    candidate.getMonth() !== month ||
    candidate.getDate() !== day
  ) {
    candidate = new Date(
      reference.getFullYear(),
      1,
      28,
      12,
      0,
      0,
      0,
    );
  }

  const refDay = new Date(reference);
  refDay.setHours(0, 0, 0, 0);

  if (candidate < refDay) {
    candidate = new Date(
      reference.getFullYear() + 1,
      month,
      day,
      12,
      0,
      0,
      0,
    );

    if (
      candidate.getMonth() !== month ||
      candidate.getDate() !== day
    ) {
      candidate = new Date(
        reference.getFullYear() + 1,
        1,
        28,
        12,
        0,
        0,
        0,
      );
    }
  }

  return candidate;
}

function diffInDays(dateA: Date, dateB: Date) {
  const a = new Date(dateA);
  const b = new Date(dateB);
  a.setHours(0, 0, 0, 0);
  b.setHours(0, 0, 0, 0);

  return Math.round((a.getTime() - b.getTime()) / 86400000);
}

export default async function DashboardPage() {
  const user = await requireUser().catch(() => null);
  if (!user) redirect("/login");

  const { now, start, end } = startAndEndOfToday();

  const empresa = await prisma.empresa.findUnique({
    where: { id: user.empresaId },
    select: {
      id: true,
      nomeFantasia: true,
      razaoSocial: true,
      configuracao: {
        select: {
          timezone: true,
        },
      },
    },
  });

  if (!empresa) {
    redirect("/login");
  }

  const [
    agendamentosHoje,
    comandasAbertas,
    comandasFechadasHoje,
    caixaEntradasHoje,
    caixaSaidasHoje,
    clientesAtivos,
    profissionaisAtivos,
    contasReceberVencidas,
    proximosHorarios,
    produtosCandidatos,
    clientesAniversario,
  ] = await Promise.all([
    prisma.agendamento.count({
      where: {
        empresaId: user.empresaId,
        inicio: {
          gte: start,
          lte: end,
        },
        status: {
          not: StatusAgendamento.CANCELADO,
        },
      },
    }),

    prisma.comanda.count({
      where: {
        empresaId: user.empresaId,
        status: {
          in: [StatusComanda.ABERTA, StatusComanda.EM_ANDAMENTO],
        },
      },
    }),

    prisma.comanda.aggregate({
      where: {
        empresaId: user.empresaId,
        status: StatusComanda.FECHADA,
        fechadaEm: {
          gte: start,
          lte: end,
        },
      },
      _sum: {
        total: true,
      },
    }),

    prisma.caixaMovimento.aggregate({
      where: {
        empresaId: user.empresaId,
        tipo: TipoCaixaMovimento.ENTRADA,
        dataMovimento: {
          gte: start,
          lte: end,
        },
      },
      _sum: {
        valor: true,
      },
    }),

    prisma.caixaMovimento.aggregate({
      where: {
        empresaId: user.empresaId,
        tipo: TipoCaixaMovimento.SAIDA,
        dataMovimento: {
          gte: start,
          lte: end,
        },
      },
      _sum: {
        valor: true,
      },
    }),

    prisma.cliente.count({
      where: {
        empresaId: user.empresaId,
        ativo: true,
      },
    }),

    prisma.profissional.count({
      where: {
        empresaId: user.empresaId,
        ativo: true,
      },
    }),

    prisma.contaReceber.count({
      where: {
        empresaId: user.empresaId,
        status: {
          in: ["ABERTA", "PARCIAL", "VENCIDA"],
        },
        valorAberto: {
          gt: 0,
        },
        vencimento: {
          lt: now,
        },
      },
    }),

    prisma.agendamento.findMany({
      where: {
        empresaId: user.empresaId,
        inicio: {
          gte: start,
          lte: end,
        },
        status: {
          in: [
            StatusAgendamento.AGENDADO,
            StatusAgendamento.CONFIRMADO,
            StatusAgendamento.EM_ATENDIMENTO,
            StatusAgendamento.CONCLUIDO,
            StatusAgendamento.FALTOU,
          ],
        },
      },
      include: {
        cliente: {
          select: {
            nome: true,
          },
        },
        profissional: {
          select: {
            nome: true,
          },
        },
        servicos: {
          select: {
            nomeSnapshot: true,
            ordem: true,
          },
          orderBy: {
            ordem: "asc",
          },
        },
      },
      orderBy: {
        inicio: "asc",
      },
      take: 12,
    }),

    prisma.produto.findMany({
      where: {
        empresaId: user.empresaId,
        ativo: true,
        estoqueMinimo: {
          gt: 0,
        },
      },
      select: {
        id: true,
        nome: true,
        estoqueAtual: true,
        estoqueMinimo: true,
      },
      orderBy: [{ estoqueAtual: "asc" }, { nome: "asc" }],
    }),

    prisma.cliente.findMany({
      where: {
        empresaId: user.empresaId,
        ativo: true,
        dataNascimento: {
          not: null,
        },
      },
      select: {
        id: true,
        nome: true,
        telefone: true,
        whatsapp: true,
        dataNascimento: true,
      },
      orderBy: {
        nome: "asc",
      },
    }),
  ]);

  const estoqueBaixoLista = produtosCandidatos.filter(
    (item) => item.estoqueAtual <= item.estoqueMinimo,
  );

  const receitaPorComandas = toNumber(comandasFechadasHoje._sum.total);
  const entradasHoje = toNumber(caixaEntradasHoje._sum.valor);
  const saidasHoje = toNumber(caixaSaidasHoje._sum.valor);
  const caixaLiquidoHoje = entradasHoje - saidasHoje;
  const receitaDoDia =
    receitaPorComandas > 0 ? receitaPorComandas : Math.max(caixaLiquidoHoje, 0);

  const aniversariosProcessados = clientesAniversario
    .filter((cliente) => cliente.dataNascimento)
    .map((cliente) => {
      const proximoAniversario = getNextBirthdayDate(
        cliente.dataNascimento as Date,
        now,
      );
      const diasRestantes = diffInDays(proximoAniversario, now);

      return {
        id: cliente.id,
        nome: cliente.nome,
        telefone: cliente.telefone,
        whatsapp: cliente.whatsapp,
        dataNascimento: cliente.dataNascimento as Date,
        proximoAniversario,
        diasRestantes,
      };
    })
    .sort((a, b) => {
      if (a.diasRestantes !== b.diasRestantes) {
        return a.diasRestantes - b.diasRestantes;
      }
      return a.nome.localeCompare(b.nome);
    });

  const aniversariantesHoje = aniversariosProcessados.filter(
    (item) => item.diasRestantes === 0,
  );

  const proximosAniversarios = aniversariosProcessados.filter(
    (item) => item.diasRestantes >= 0 && item.diasRestantes <= 7,
  );

  const nomeEmpresa =
    empresa.nomeFantasia || empresa.razaoSocial || "Sistema Administrativo";

  return (
    <div className={ui.page}>
      <section className={ui.hero}>
        <div className="relative z-10">
          <h1 className={`text-3xl font-bold font-display text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-fuchsia-600 dark:from-violet-400 dark:to-fuchsia-400`}>Dashboard</h1>
          <p className={`mt-2 font-medium ${ui.muted}`}>
            Visão geral do sistema para {user.nome}.
          </p>
          <p className={`mt-1 text-sm ${ui.muted}`}>{nomeEmpresa}</p>
        </div>
        <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-brand-gradient opacity-10 blur-[80px] animate-float" />
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
        <StatCard
          title="Agendamentos hoje"
          value={String(agendamentosHoje)}
          href="/agenda"
          helper="Agenda do dia"
          icon={CalendarDays}
          color="#3b82f6"
        />
        <StatCard
          title="Comandas abertas"
          value={String(comandasAbertas)}
          href="/comandas"
          helper="Abertas e em andamento"
          icon={Receipt}
          color="#8b5cf6"
        />
        <StatCard
          title="Receita do dia"
          value={formatMoney(receitaDoDia)}
          href="/financeiro"
          helper="Fechamentos de hoje"
          icon={Landmark}
          color="#10b981"
        />
        <StatCard
          title="Estoque baixo"
          value={String(estoqueBaixoLista.length)}
          href="/estoque"
          helper="Produtos abaixo do mínimo"
          icon={Package}
          color="#f59e0b"
        />
        <StatCard
          title="Aniversariantes hoje"
          value={String(aniversariantesHoje.length)}
          href="/clientes"
          helper="Clientes para felicitar"
          icon={Cake}
          color="#ec4899"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
        <StatCard
          title="Clientes ativos"
          value={String(clientesAtivos)}
          href="/clientes"
          icon={Users}
          color="#06b6d4"
        />
        <StatCard
          title="Profissionais ativos"
          value={String(profissionaisAtivos)}
          href="/profissionais"
          icon={Scissors}
          color="#d946ef"
        />
        <StatCard
          title="Contas a receber vencidas"
          value={String(contasReceberVencidas)}
          href="/financeiro/contas-receber"
          icon={FileWarning}
          color="#ef4444"
        />
      </div>

      {aniversariantesHoje.length > 0 ? (
        <div className={ui.birthday + " animate-fade-in"}>
          <Cake className="h-5 w-5" />
          Hoje tem {aniversariantesHoje.length} aniversariante(s) cadastrado(s) no sistema.
        </div>
      ) : null}

      {agendamentosHoje === 0 ? (
        <div className={ui.warn + " animate-fade-in"}>
          Hoje ainda não há agendamentos encontrados no dashboard.
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
        <section className={ui.card}>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className={`text-xl font-bold ${ui.title}`}>Horários de hoje</h2>
              <p className={`mt-1 text-sm ${ui.muted}`}>
                Lista do dia com cliente, profissional e serviços.
              </p>
            </div>

            <Link href="/agenda" className={ui.link}>
              Abrir agenda
            </Link>
          </div>

          <div className="space-y-3">
            {proximosHorarios.length === 0 ? (
              <div className={ui.soft}>
                <p className={ui.muted}>Nenhum horário encontrado para hoje.</p>
              </div>
            ) : (
              proximosHorarios.map((item) => {
                const servicos = item.servicos
                  .map((s) => s.nomeSnapshot)
                  .filter(Boolean);

                const status =
                  item.status === "AGENDADO"
                    ? "Agendado"
                    : item.status === "CONFIRMADO"
                    ? "Confirmado"
                    : item.status === "EM_ATENDIMENTO"
                    ? "Em atendimento"
                    : item.status === "CONCLUIDO"
                    ? "Concluído"
                    : item.status === "FALTOU"
                    ? "Faltou"
                    : item.status;

                return (
                  <div key={item.id} className={ui.soft}>
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className={`text-base font-semibold ${ui.title}`}>
                          {formatHour(item.inicio)} • {item.cliente.nome}
                        </p>
                        <p className={`mt-1 text-sm ${ui.muted}`}>
                          Profissional: {item.profissional.nome}
                        </p>
                        <p className={`mt-1 text-sm ${ui.muted}`}>
                          Serviços:{" "}
                          {servicos.length ? servicos.join(", ") : "Não informado"}
                        </p>
                      </div>

                      <div className="text-left md:text-right">
                        <p className={`text-sm font-semibold ${ui.title}`}>
                          {status}
                        </p>
                        <p className={`mt-1 text-sm ${ui.muted}`}>
                          {formatDateTime(item.inicio)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        <div className="space-y-6">
          <section className={ui.card}>
            <h2 className={`text-xl font-bold ${ui.title}`}>Alertas de aniversário</h2>
            <p className={`mt-1 text-sm ${ui.muted}`}>
              Clientes que fazem aniversário hoje e nos próximos 7 dias.
            </p>

            <div className="mt-4 space-y-3">
              {proximosAniversarios.length === 0 ? (
                <div className={ui.soft}>
                  <p className={ui.muted}>
                    Nenhum aniversário para hoje ou próximos 7 dias.
                  </p>
                </div>
              ) : (
                proximosAniversarios.map((cliente) => (
                  <div key={cliente.id} className={ui.soft}>
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className={`font-semibold ${ui.title}`}>{cliente.nome}</p>
                        <p className={`mt-1 text-sm ${ui.muted}`}>
                          Aniversário: {formatDateBR(cliente.proximoAniversario)}
                        </p>
                        {cliente.whatsapp || cliente.telefone ? (
                          <p className={`mt-1 text-sm ${ui.muted}`}>
                            Contato: {cliente.whatsapp || cliente.telefone}
                          </p>
                        ) : null}
                      </div>

                      <div className="text-left md:text-right">
                        <p className={`text-sm font-semibold ${ui.title}`}>
                          {cliente.diasRestantes === 0
                            ? "Hoje"
                            : cliente.diasRestantes === 1
                            ? "Amanhã"
                            : `Em ${cliente.diasRestantes} dias`}
                        </p>

                        {(cliente.whatsapp || cliente.telefone) &&
                        (cliente.whatsapp || cliente.telefone)?.replace(/\D+/g, "") ? (
                          <a
                            href={`https://wa.me/${(cliente.whatsapp || cliente.telefone || "").replace(/\D+/g, "")}`}
                            target="_blank"
                            className="mt-2 inline-flex items-center justify-center rounded-2xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                          >
                            Chamar no WhatsApp
                          </a>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className={ui.card}>
            <h2 className={`text-xl font-bold ${ui.title}`}>
              Resumo financeiro de hoje
            </h2>
            <div className="mt-4 space-y-3">
              <div className={ui.soft}>
                <p className={ui.statLabel}>Entradas no caixa</p>
                <p className="mt-2 text-2xl font-bold text-[var(--text)]">
                  {formatMoney(entradasHoje)}
                </p>
              </div>

              <div className={ui.soft}>
                <p className={ui.statLabel}>Saídas no caixa</p>
                <p className="mt-2 text-2xl font-bold text-[var(--text)]">
                  {formatMoney(saidasHoje)}
                </p>
              </div>

              <div className={ui.soft}>
                <p className={ui.statLabel}>Caixa líquido do dia</p>
                <p className="mt-2 text-2xl font-bold text-[var(--text)]">
                  {formatMoney(caixaLiquidoHoje)}
                </p>
              </div>
            </div>
          </section>

          <section className={ui.card}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className={`text-xl font-bold ${ui.title}`}>Estoque baixo</h2>
                <p className={`mt-1 text-sm ${ui.muted}`}>
                  Produtos no mínimo ou abaixo dele.
                </p>
              </div>

              <Link href="/estoque" className={ui.link}>
                Abrir estoque
              </Link>
            </div>

            <div className="space-y-3">
              {estoqueBaixoLista.length === 0 ? (
                <div className={ui.soft}>
                  <p className={ui.muted}>Nenhum produto com estoque baixo.</p>
                </div>
              ) : (
                estoqueBaixoLista.slice(0, 8).map((produto) => (
                  <div key={produto.id} className={ui.soft}>
                    <p className={`font-semibold ${ui.title}`}>{produto.nome}</p>
                    <p className={`mt-1 text-sm ${ui.muted}`}>
                      Atual: {produto.estoqueAtual} • Mínimo: {produto.estoqueMinimo}
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}