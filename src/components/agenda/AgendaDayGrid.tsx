import Link from "next/link";
import { StatusAgendamento } from "@prisma/client";
import { buildTimeSlots, formatTime } from "@/lib/agenda";
import {
  setAgendamentoStatusAction,
  deleteBloqueioAgendaAction,
} from "@/actions/agenda";

type ProfessionalItem = {
  id: string;
  nome: string;
  corAgenda: string | null;
  fotoUrl?: string | null;
};

type AgendamentoItem = {
  id: string;
  profissionalId: string;
  clienteNome: string;
  clienteFotoUrl?: string | null;
  profissionalNome?: string;
  profissionalFotoUrl?: string | null;
  inicio: Date;
  fim: Date;
  status: StatusAgendamento;
  encaixe: boolean;
  observacoes: string | null;
  servicos: { nomeSnapshot: string }[];
};

type BloqueioItem = {
  id: string;
  profissionalId: string;
  dataInicio: Date;
  dataFim: Date;
  tipo: string;
  descricao: string | null;
  cor: string | null;
};

type Props = {
  dia: string;
  profissionais: ProfessionalItem[];
  agendamentos: AgendamentoItem[];
  bloqueios: BloqueioItem[];
  intervalMinutes?: number;
  startHour?: number;
  endHour?: number;
};

const SLOT_HEIGHT = 44;

function statusStyles(status: StatusAgendamento, encaixe: boolean) {
  if (encaixe) {
    return {
      bg: "#c084fc",
      border: "#9333ea",
      text: "#3b0764",
    };
  }

  switch (status) {
    case StatusAgendamento.AGENDADO:
      return { bg: "#bbf7d0", border: "#16a34a", text: "#14532d" };
    case StatusAgendamento.CONFIRMADO:
      return { bg: "#bfdbfe", border: "#2563eb", text: "#1e3a8a" };
    case StatusAgendamento.EM_ATENDIMENTO:
      return { bg: "#fde68a", border: "#d97706", text: "#78350f" };
    case StatusAgendamento.CONCLUIDO:
      return { bg: "#93c5fd", border: "#1d4ed8", text: "#172554" };
    case StatusAgendamento.CANCELADO:
      return { bg: "#fecaca", border: "#dc2626", text: "#7f1d1d" };
    case StatusAgendamento.FALTOU:
      return { bg: "#fca5a5", border: "#b91c1c", text: "#450a0a" };
    default:
      return { bg: "#e5e7eb", border: "#64748b", text: "#334155" };
  }
}

function getInitials(name?: string | null) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function AvatarThumb({
  src,
  name,
  size = 32,
}: {
  src?: string | null;
  name?: string | null;
  size?: number;
}) {
  return (
    <div
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100 shadow-sm"
      style={{ width: size, height: size }}
    >
      {src ? (
        <img
          src={src}
          alt={name || "Foto"}
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="text-[11px] font-semibold text-slate-500">
          {getInitials(name)}
        </span>
      )}
    </div>
  );
}

export default function AgendaDayGrid({
  dia,
  profissionais,
  agendamentos,
  bloqueios,
  intervalMinutes = 30,
  startHour = 8,
  endHour = 20,
}: Props) {
  const slots = buildTimeSlots(startHour, endHour, intervalMinutes);
  const totalHeight = slots.length * SLOT_HEIGHT;

  if (!profissionais.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">
          Nenhum profissional selecionado
        </h3>
        <p className="mt-2 text-sm text-slate-500">
          Ajuste o filtro para visualizar a agenda.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div
        className="grid min-w-[980px]"
        style={{
          gridTemplateColumns: `88px repeat(${profissionais.length}, minmax(260px, 1fr))`,
        }}
      >
        <div className="sticky left-0 z-20 border-b border-r border-slate-200 bg-slate-50 px-3 py-4 text-sm font-semibold text-slate-500">
          Hora
        </div>

        {profissionais.map((profissional) => (
          <div
            key={profissional.id}
            className="border-b border-r border-slate-200 bg-slate-50 px-4 py-4"
          >
            <div className="flex items-center gap-3">
              <AvatarThumb
                src={profissional.fotoUrl}
                name={profissional.nome}
                size={34}
              />
              <span
                className="h-4 w-4 rounded-full border border-slate-300"
                style={{ backgroundColor: profissional.corAgenda || "#1d4ed8" }}
              />
              <div className="font-semibold text-slate-900">
                {profissional.nome}
              </div>
            </div>
          </div>
        ))}

        <div className="sticky left-0 z-10 border-r border-slate-200 bg-white">
          <div style={{ height: totalHeight }}>
            {slots.map((slot) => (
              <div
                key={slot}
                className="border-b border-slate-200 px-3 py-2 text-xs text-slate-500"
                style={{ height: SLOT_HEIGHT }}
              >
                {slot}
              </div>
            ))}
          </div>
        </div>

        {profissionais.map((profissional) => {
          const colAgendamentos = agendamentos.filter(
            (item) => item.profissionalId === profissional.id
          );
          const colBloqueios = bloqueios.filter(
            (item) => item.profissionalId === profissional.id
          );

          return (
            <div
              key={profissional.id}
              className="relative border-r border-slate-200 bg-white"
            >
              <div className="relative" style={{ height: totalHeight }}>
                {slots.map((slot, index) => (
                  <Link
                    key={slot}
                    href={`/agenda?dia=${dia}&novo=1&profissionalId=${profissional.id}&hora=${slot}`}
                    className="absolute left-0 right-0 border-b border-slate-200 hover:bg-slate-50"
                    style={{
                      top: index * SLOT_HEIGHT,
                      height: SLOT_HEIGHT,
                    }}
                    title={`Novo às ${slot}`}
                  />
                ))}

                {colBloqueios.map((bloqueio) => {
                  const startMinutes =
                    bloqueio.dataInicio.getHours() * 60 +
                    bloqueio.dataInicio.getMinutes();
                  const endMinutes =
                    bloqueio.dataFim.getHours() * 60 +
                    bloqueio.dataFim.getMinutes();
                  const top =
                    ((startMinutes - startHour * 60) / intervalMinutes) *
                    SLOT_HEIGHT;
                  const height =
                    ((endMinutes - startMinutes) / intervalMinutes) *
                    SLOT_HEIGHT;

                  if (height <= 0) return null;

                  return (
                    <div
                      key={bloqueio.id}
                      className="absolute left-2 right-2 overflow-hidden rounded-2xl border p-2 shadow-sm"
                      style={{
                        top,
                        height,
                        backgroundColor: bloqueio.cor || "#fecaca",
                        borderColor: "#f87171",
                        zIndex: 20,
                      }}
                    >
                      <Link
                        href={`/agenda/bloqueios/${bloqueio.id}/editar`}
                        className="block h-full text-xs text-slate-900"
                      >
                        <div className="font-semibold uppercase tracking-wide">
                          {bloqueio.tipo}
                        </div>
                        <div className="mt-1">
                          {formatTime(bloqueio.dataInicio)} às{" "}
                          {formatTime(bloqueio.dataFim)}
                        </div>
                        {bloqueio.descricao ? (
                          <div className="mt-1 line-clamp-2">
                            {bloqueio.descricao}
                          </div>
                        ) : null}
                      </Link>

                      <form action={deleteBloqueioAgendaAction} className="mt-2">
                        <input type="hidden" name="id" value={bloqueio.id} />
                        <input type="hidden" name="dia" value={dia} />
                        <button
                          type="submit"
                          className="rounded-lg border border-red-300 bg-white/80 px-2 py-1 text-[11px] font-semibold text-red-700"
                        >
                          Excluir
                        </button>
                      </form>
                    </div>
                  );
                })}

                {colAgendamentos.map((agendamento) => {
                  const startMinutes =
                    agendamento.inicio.getHours() * 60 +
                    agendamento.inicio.getMinutes();
                  const endMinutes =
                    agendamento.fim.getHours() * 60 +
                    agendamento.fim.getMinutes();

                  const top =
                    ((startMinutes - startHour * 60) / intervalMinutes) *
                    SLOT_HEIGHT;
                  const height =
                    ((endMinutes - startMinutes) / intervalMinutes) *
                    SLOT_HEIGHT;

                  if (height <= 0) return null;

                  const styles = statusStyles(
                    agendamento.status,
                    agendamento.encaixe
                  );

                  const servicosLabel = agendamento.servicos.length
                    ? agendamento.servicos.map((s) => s.nomeSnapshot).join(", ")
                    : "Sem serviço";

                  const compact = height <= 46;
                  const showObservacao = height >= 100;
                  const showStatusActions = height >= 130;
                  const showEditAndComandaButtons = height >= 62;

                  return (
                    <div
                      key={agendamento.id}
                      className="absolute left-2 right-2 rounded-2xl border shadow-sm"
                      style={{
                        top,
                        height,
                        backgroundColor: styles.bg,
                        borderColor: styles.border,
                        color: styles.text,
                        zIndex: 30,
                        overflow: "hidden",
                      }}
                    >
                      <div className="relative flex h-full flex-col overflow-hidden px-2 py-2">
                        {showEditAndComandaButtons ? (
                          <div className="absolute right-2 top-2 z-10 flex gap-1">
                            <Link
                              href={`/agenda/${agendamento.id}/comanda`}
                              className="rounded-lg border border-white/80 bg-white/75 px-2 py-1 text-[10px] font-semibold"
                            >
                              Comanda
                            </Link>
                            <Link
                              href={`/agenda/${agendamento.id}/editar`}
                              className="rounded-lg border border-white/80 bg-white/75 px-2 py-1 text-[10px] font-semibold"
                            >
                              Editar
                            </Link>
                          </div>
                        ) : (
                          <div className="absolute right-2 top-2 z-10">
                            <Link
                              href={`/agenda/${agendamento.id}/editar`}
                              className="rounded-lg border border-white/80 bg-white/75 px-2 py-1 text-[10px] font-semibold"
                            >
                              Editar
                            </Link>
                          </div>
                        )}

                        <Link
                          href={`/agenda/${agendamento.id}/comanda`}
                          className={`block min-h-0 flex-1 overflow-hidden ${
                            showEditAndComandaButtons ? "pr-28" : "pr-16"
                          }`}
                          title="Abrir comanda"
                        >
                          {compact ? (
                            <div className="flex items-center gap-2 overflow-hidden">
                              <span
                                className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide"
                                style={{
                                  backgroundColor: "rgba(255,255,255,0.65)",
                                  border: `1px solid ${styles.border}`,
                                }}
                              >
                                {agendamento.status}
                              </span>

                              <AvatarThumb
                                src={agendamento.clienteFotoUrl}
                                name={agendamento.clienteNome}
                                size={22}
                              />

                              <span className="min-w-0 truncate text-[12px] font-semibold">
                                {agendamento.clienteNome}
                              </span>

                              <span className="truncate text-[11px] font-medium opacity-90">
                                {servicosLabel}
                              </span>

                              <span className="shrink-0 text-[11px] font-medium opacity-90">
                                {formatTime(agendamento.inicio)} às{" "}
                                {formatTime(agendamento.fim)}
                              </span>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center gap-2 overflow-hidden">
                                <span
                                  className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                                  style={{
                                    backgroundColor: "rgba(255,255,255,0.65)",
                                    border: `1px solid ${styles.border}`,
                                  }}
                                >
                                  {agendamento.status}
                                </span>

                                <div className="flex min-w-0 items-center gap-2">
                                  <AvatarThumb
                                    src={agendamento.clienteFotoUrl}
                                    name={agendamento.clienteNome}
                                    size={26}
                                  />
                                  <span className="min-w-0 truncate text-sm font-semibold">
                                    {agendamento.clienteNome}
                                  </span>
                                </div>
                              </div>

                              <div className="mt-1 flex items-center gap-2 overflow-hidden pl-[36px]">
                                <span className="min-w-0 truncate text-[12px] font-medium opacity-90">
                                  {servicosLabel}
                                </span>
                                <span className="shrink-0 text-[11px] font-medium opacity-90">
                                  {formatTime(agendamento.inicio)} às{" "}
                                  {formatTime(agendamento.fim)}
                                </span>
                              </div>

                              {showObservacao && agendamento.observacoes ? (
                                <div className="mt-1 truncate pl-[36px] text-[12px] opacity-80">
                                  {agendamento.observacoes}
                                </div>
                              ) : null}
                            </>
                          )}
                        </Link>

                        {showStatusActions ? (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {agendamento.status !== StatusAgendamento.CONFIRMADO ? (
                              <form action={setAgendamentoStatusAction}>
                                <input type="hidden" name="id" value={agendamento.id} />
                                <input type="hidden" name="dia" value={dia} />
                                <input
                                  type="hidden"
                                  name="status"
                                  value={StatusAgendamento.CONFIRMADO}
                                />
                                <button
                                  type="submit"
                                  className="rounded-lg border border-white/80 bg-white/70 px-2 py-1 text-[10px] font-semibold"
                                >
                                  Confirmar
                                </button>
                              </form>
                            ) : null}

                            {agendamento.status !== StatusAgendamento.CONCLUIDO ? (
                              <form action={setAgendamentoStatusAction}>
                                <input type="hidden" name="id" value={agendamento.id} />
                                <input type="hidden" name="dia" value={dia} />
                                <input
                                  type="hidden"
                                  name="status"
                                  value={StatusAgendamento.CONCLUIDO}
                                />
                                <button
                                  type="submit"
                                  className="rounded-lg border border-white/80 bg-white/70 px-2 py-1 text-[10px] font-semibold"
                                >
                                  Concluir
                                </button>
                              </form>
                            ) : null}

                            {agendamento.status !== StatusAgendamento.CANCELADO ? (
                              <form action={setAgendamentoStatusAction}>
                                <input type="hidden" name="id" value={agendamento.id} />
                                <input type="hidden" name="dia" value={dia} />
                                <input
                                  type="hidden"
                                  name="status"
                                  value={StatusAgendamento.CANCELADO}
                                />
                                <button
                                  type="submit"
                                  className="rounded-lg border border-white/80 bg-white/70 px-2 py-1 text-[10px] font-semibold"
                                >
                                  Cancelar
                                </button>
                              </form>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}