"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import type { BookingState } from "./actions";
import { criarAgendamentoSiteAction } from "./actions";

type ServicoItem = {
  id: string;
  nome: string;
  descricao: string | null;
  duracaoMin: number;
  preco: string;
};

type ProfissionalItem = {
  id: string;
  nome: string;
};

const initialState: BookingState = {
  ok: false,
  message: "",
};

function formatMoney(value: string) {
  const n = Number(value || 0);

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number.isFinite(n) ? n : 0);
}

export default function PublicBookingForm({
  servicos,
  profissionais,
}: {
  servicos: ServicoItem[];
  profissionais: ProfissionalItem[];
}) {
  const [state, formAction] = useActionState(
    criarAgendamentoSiteAction,
    initialState
  );

  const [profissionalId, setProfissionalId] = useState("");
  const [data, setData] = useState("");
  const [hora, setHora] = useState("");
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [horarios, setHorarios] = useState<string[]>([]);
  const [loadingHorarios, setLoadingHorarios] = useState(false);

  const duracaoTotal = useMemo(() => {
    return selecionados.reduce((acc, id) => {
      const servico = servicos.find((item) => item.id === id);
      return acc + (servico?.duracaoMin ?? 0);
    }, 0);
  }, [selecionados, servicos]);

  useEffect(() => {
    setHora("");

    async function carregarHorarios() {
      if (!profissionalId || !data || selecionados.length === 0) {
        setHorarios([]);
        return;
      }

      setLoadingHorarios(true);

      try {
        const params = new URLSearchParams({
          profissionalId,
          data,
          servicoIds: selecionados.join(","),
        });

        const res = await fetch(`/api/site/horarios?${params.toString()}`, {
          cache: "no-store",
        });

        const json = await res.json();
        setHorarios(Array.isArray(json.horarios) ? json.horarios : []);
      } catch {
        setHorarios([]);
      } finally {
        setLoadingHorarios(false);
      }
    }

    carregarHorarios();
  }, [profissionalId, data, selecionados]);

  function toggleServico(id: string) {
    setSelecionados((atual) =>
      atual.includes(id)
        ? atual.filter((item) => item !== id)
        : [...atual, id]
    );
  }

  return (
    <form
      action={formAction}
      className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div>
        <h2 className="text-2xl font-bold text-slate-900">
          Agendamento online
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Escolha o profissional, os serviços, a data e o horário.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Nome
          </label>
          <input
            name="nome"
            required
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900"
            placeholder="Seu nome"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Telefone / WhatsApp
          </label>
          <input
            name="telefone"
            required
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900"
            placeholder="(17) 99999-9999"
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium text-slate-700">
            E-mail
          </label>
          <input
            name="email"
            type="email"
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900"
            placeholder="seuemail@exemplo.com"
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Profissional
        </label>
        <select
          name="profissionalId"
          value={profissionalId}
          onChange={(e) => setProfissionalId(e.target.value)}
          required
          className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900"
        >
          <option value="">Selecione um profissional</option>
          {profissionais.map((item) => (
            <option key={item.id} value={item.id}>
              {item.nome}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Serviços
        </label>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {servicos.map((item) => {
            const ativo = selecionados.includes(item.id);

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => toggleServico(item.id)}
                className={`rounded-2xl border p-4 text-left transition ${
                  ativo
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{item.nome}</p>
                    {item.descricao ? (
                      <p
                        className={`mt-1 text-sm ${
                          ativo ? "text-slate-200" : "text-slate-500"
                        }`}
                      >
                        {item.descricao}
                      </p>
                    ) : null}
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold">
                      {formatMoney(item.preco)}
                    </p>
                    <p
                      className={`text-xs ${
                        ativo ? "text-slate-200" : "text-slate-500"
                      }`}
                    >
                      {item.duracaoMin} min
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {selecionados.map((id) => (
          <input key={id} type="hidden" name="servicoIds" value={id} />
        ))}

        <div className="mt-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Duração total estimada: <strong>{duracaoTotal} min</strong>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Data
          </label>
          <input
            name="data"
            type="date"
            value={data}
            onChange={(e) => setData(e.target.value)}
            required
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Horário escolhido
          </label>
          <input
            name="hora"
            value={hora}
            readOnly
            required
            className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
            placeholder="Selecione abaixo"
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Horários disponíveis
        </label>

        {loadingHorarios ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
            Carregando horários...
          </div>
        ) : horarios.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
            Selecione profissional, serviço e data para ver os horários.
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {horarios.map((item) => {
              const ativo = hora === item;

              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => setHora(item)}
                  className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
                    ativo
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  {item}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Observações
        </label>
        <textarea
          name="observacoes"
          rows={4}
          className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900"
          placeholder="Ex.: preferência, detalhes do atendimento..."
        />
      </div>

      {state.message ? (
        <div
          className={`rounded-2xl px-4 py-3 text-sm ${
            state.ok
              ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {state.message}
        </div>
      ) : null}

      <button
        type="submit"
        className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
      >
        Confirmar agendamento
      </button>
    </form>
  );
}