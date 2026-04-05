"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { addMinutesToTime } from "@/lib/agenda";
import {
  emptyAgendamentoFormValues,
  initialAgendamentoActionState,
  type AgendamentoActionState,
  type AgendamentoFieldName,
  type AgendamentoFormValues,
} from "@/schemas/agendamento";

type ClienteOption = {
  id: string;
  nome: string;
};

type ProfissionalOption = {
  id: string;
  nome: string;
  corAgenda: string | null;
};

type ServicoOption = {
  id: string;
  nome: string;
  duracaoMin: number;
  preco: string;
};

type Props = {
  mode: "create" | "edit";
  action: (
    prevState: AgendamentoActionState,
    formData: FormData
  ) => Promise<AgendamentoActionState>;
  initialValues?: Partial<AgendamentoFormValues>;
  agendamentoId?: string;
  cancelHref?: string;
  clientes: ClienteOption[];
  profissionais: ProfissionalOption[];
  servicos: ServicoOption[];
};

function SubmitButton({ mode }: { mode: "create" | "edit" }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
    >
      {pending
        ? "Salvando..."
        : mode === "create"
          ? "Salvar agendamento"
          : "Salvar alterações"}
    </button>
  );
}

const inputClass =
  "w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900";
const labelClass = "mb-1 block text-sm font-medium text-slate-700";
const errorClass = "mt-1 text-xs font-medium text-red-600";

function formatMoney(value: string | number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value || 0));
}

export default function AgendamentoForm({
  mode,
  action,
  initialValues,
  agendamentoId,
  cancelHref = "/agenda",
  clientes,
  profissionais,
  servicos,
}: Props) {
  const [state, formAction] = useActionState(
    action,
    initialAgendamentoActionState
  );

  const baseValues = useMemo<AgendamentoFormValues>(
    () => ({
      ...emptyAgendamentoFormValues,
      ...initialValues,
      servicoIds: initialValues?.servicoIds ?? [],
    }),
    [initialValues]
  );

  const [formValues, setFormValues] = useState<AgendamentoFormValues>(baseValues);
  const [servicoSelecionadoId, setServicoSelecionadoId] = useState("");

  useEffect(() => {
    setFormValues(baseValues);
  }, [baseValues]);

  useEffect(() => {
    if (!state.fields) return;

    setFormValues((prev) => ({
      ...prev,
      clienteId: state.fields?.clienteId ?? prev.clienteId,
      profissionalId: state.fields?.profissionalId ?? prev.profissionalId,
      data: state.fields?.data ?? prev.data,
      horaInicio: state.fields?.horaInicio ?? prev.horaInicio,
      observacoes: state.fields?.observacoes ?? prev.observacoes,
      encaixe:
        typeof state.fields?.encaixe === "boolean"
          ? state.fields.encaixe
          : prev.encaixe,
      servicoIds: state.fields?.servicoIds ?? prev.servicoIds,
    }));
  }, [state.fields]);

  function fieldError(name: AgendamentoFieldName) {
    const message = state.fieldErrors?.[name];
    return message ? <p className={errorClass}>{message}</p> : null;
  }

  function setField<K extends keyof AgendamentoFormValues>(
    field: K,
    value: AgendamentoFormValues[K]
  ) {
    setFormValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function adicionarServico() {
    if (!servicoSelecionadoId) return;

    setFormValues((prev) => {
      if (prev.servicoIds.includes(servicoSelecionadoId)) {
        return prev;
      }

      return {
        ...prev,
        servicoIds: [...prev.servicoIds, servicoSelecionadoId],
      };
    });

    setServicoSelecionadoId("");
  }

  function removerServico(index: number) {
    setFormValues((prev) => ({
      ...prev,
      servicoIds: prev.servicoIds.filter((_, i) => i !== index),
    }));
  }

  const selectedServicos = formValues.servicoIds
    .map((id) => servicos.find((item) => item.id === id))
    .filter(Boolean) as ServicoOption[];

  const duracaoTotal = selectedServicos.reduce(
    (acc, item) => acc + item.duracaoMin,
    0
  );

  const valorTotal = selectedServicos.reduce(
    (acc, item) => acc + Number(item.preco || 0),
    0
  );

  const fimPreview =
    formValues.horaInicio && duracaoTotal
      ? addMinutesToTime(formValues.horaInicio, duracaoTotal)
      : formValues.horaInicio || "";

  return (
    <form
      action={formAction}
      className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      {mode === "edit" ? (
        <input type="hidden" name="id" value={agendamentoId} />
      ) : null}

      {state.error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      ) : null}

      <div>
        <h2 className="text-lg font-semibold text-slate-900">Agendamento</h2>
        <p className="mt-1 text-sm text-slate-500">
          Selecione cliente, profissional, horário e os serviços.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="md:col-span-2">
          <label className={labelClass}>Cliente *</label>
          <select
            value={formValues.clienteId}
            onChange={(e) => setField("clienteId", e.target.value)}
            className={inputClass}
          >
            <option value="">Selecione</option>
            {clientes.map((cliente) => (
              <option key={cliente.id} value={cliente.id}>
                {cliente.nome}
              </option>
            ))}
          </select>
          {fieldError("clienteId")}
        </div>

        <div className="md:col-span-2">
          <label className={labelClass}>Profissional *</label>
          <select
            value={formValues.profissionalId}
            onChange={(e) => setField("profissionalId", e.target.value)}
            className={inputClass}
          >
            <option value="">Selecione</option>
            {profissionais.map((profissional) => (
              <option key={profissional.id} value={profissional.id}>
                {profissional.nome}
              </option>
            ))}
          </select>
          {fieldError("profissionalId")}
        </div>

        <div>
          <label className={labelClass}>Data *</label>
          <input
            type="date"
            value={formValues.data}
            onChange={(e) => setField("data", e.target.value)}
            className={inputClass}
          />
          {fieldError("data")}
        </div>

        <div>
          <label className={labelClass}>Hora inicial *</label>
          <input
            type="time"
            value={formValues.horaInicio}
            onChange={(e) => setField("horaInicio", e.target.value)}
            className={inputClass}
          />
          {fieldError("horaInicio")}
        </div>

        <div className="flex items-end">
          <label className="flex items-center gap-3 rounded-2xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={formValues.encaixe}
              onChange={(e) => setField("encaixe", e.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
            />
            Encaixe
          </label>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <h2 className="text-lg font-semibold text-slate-900">
          Serviços do agendamento
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Você pode adicionar mais de um serviço. A duração final será a soma de
          todos eles.
        </p>

        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
          <select
            value={servicoSelecionadoId}
            onChange={(e) => setServicoSelecionadoId(e.target.value)}
            className={inputClass}
          >
            <option value="">Selecione um serviço</option>
            {servicos.map((servico) => (
              <option key={servico.id} value={servico.id}>
                {servico.nome} — {servico.duracaoMin} min —{" "}
                {formatMoney(servico.preco)}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={adicionarServico}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            Adicionar serviço
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {selectedServicos.map((servico, index) => (
            <div
              key={`${servico.id}-${index}`}
              className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <div className="text-sm font-semibold text-slate-900">
                  {servico.nome}
                </div>
                <div className="text-xs text-slate-500">
                  {servico.duracaoMin} min • {formatMoney(servico.preco)}
                </div>
              </div>

              <button
                type="button"
                onClick={() => removerServico(index)}
                className="rounded-xl border border-red-700 bg-red-700 px-3 py-2 text-xs font-semibold text-white hover:bg-red-800"
              >
                Remover
              </button>
            </div>
          ))}

          {!selectedServicos.length ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-sm text-slate-500">
              Nenhum serviço adicionado.
            </div>
          ) : null}
        </div>

        {fieldError("servicoIds")}

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Quantidade de serviços
            </div>
            <div className="mt-1 text-lg font-bold text-slate-900">
              {selectedServicos.length}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Duração total
            </div>
            <div className="mt-1 text-lg font-bold text-slate-900">
              {duracaoTotal} min
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Total estimado
            </div>
            <div className="mt-1 text-lg font-bold text-slate-900">
              {formatMoney(valorTotal)}
            </div>
          </div>
        </div>

        {formValues.horaInicio ? (
          <div className="mt-3 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
            Previsão de término:{" "}
            <span className="font-semibold">
              {fimPreview || formValues.horaInicio}
            </span>
          </div>
        ) : null}
      </div>

      <div>
        <label className={labelClass}>Observações</label>
        <textarea
          value={formValues.observacoes}
          onChange={(e) => setField("observacoes", e.target.value)}
          className={`${inputClass} min-h-[120px] resize-y`}
          placeholder="Observações do atendimento"
        />
        {fieldError("observacoes" as AgendamentoFieldName)}
      </div>

      <input type="hidden" name="clienteId" value={formValues.clienteId} />
      <input
        type="hidden"
        name="profissionalId"
        value={formValues.profissionalId}
      />
      <input type="hidden" name="data" value={formValues.data} />
      <input type="hidden" name="horaInicio" value={formValues.horaInicio} />
      <input
        type="hidden"
        name="observacoes"
        value={formValues.observacoes}
      />
      <input
        type="hidden"
        name="encaixe"
        value={formValues.encaixe ? "1" : "0"}
      />

      {formValues.servicoIds.map((id, index) => (
        <input
          key={`${id}-${index}`}
          type="hidden"
          name="servicoIds"
          value={id}
        />
      ))}

      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton mode={mode} />

        <Link
          href={cancelHref}
          className="rounded-2xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
        >
          Voltar
        </Link>
      </div>
    </form>
  );
}