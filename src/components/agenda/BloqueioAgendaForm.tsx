"use client";

import Link from "next/link";
import { TipoBloqueioAgenda } from "@prisma/client";
import { useActionState, useEffect, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  emptyBloqueioFormValues,
  initialBloqueioActionState,
  type BloqueioActionState,
  type BloqueioFieldName,
  type BloqueioFormValues,
} from "@/schemas/agendamento";

type ProfissionalOption = {
  id: string;
  nome: string;
};

type Props = {
  mode: "create" | "edit";
  action: (
    prevState: BloqueioActionState,
    formData: FormData
  ) => Promise<BloqueioActionState>;
  initialValues?: Partial<BloqueioFormValues>;
  bloqueioId?: string;
  cancelHref?: string;
  profissionais: ProfissionalOption[];
};

function SubmitButton({ mode }: { mode: "create" | "edit" }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
    >
      {pending ? "Salvando..." : mode === "create" ? "Salvar bloqueio" : "Salvar alterações"}
    </button>
  );
}

const inputClass =
  "w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900";
const labelClass = "mb-1 block text-sm font-medium text-slate-700";
const errorClass = "mt-1 text-xs font-medium text-red-600";

const tipos = [
  TipoBloqueioAgenda.ALMOCO,
  TipoBloqueioAgenda.FOLGA,
  TipoBloqueioAgenda.MEDICO,
  TipoBloqueioAgenda.MANUTENCAO,
  TipoBloqueioAgenda.AUSENCIA,
  TipoBloqueioAgenda.OUTRO,
];

export default function BloqueioAgendaForm({
  mode,
  action,
  initialValues,
  bloqueioId,
  cancelHref = "/agenda",
  profissionais,
}: Props) {
  const [state, formAction] = useActionState(action, initialBloqueioActionState);

  const mergedValues = useMemo<BloqueioFormValues>(
    () => ({
      ...emptyBloqueioFormValues,
      ...initialValues,
      ...state.fields,
    }),
    [initialValues, state.fields]
  );

  const [formValues, setFormValues] = useState<BloqueioFormValues>(mergedValues);

  useEffect(() => {
    setFormValues(mergedValues);
  }, [mergedValues]);

  function fieldError(name: BloqueioFieldName) {
    const message = state.fieldErrors?.[name];
    return message ? <p className={errorClass}>{message}</p> : null;
  }

  function setField<K extends keyof BloqueioFormValues>(
    field: K,
    value: BloqueioFormValues[K]
  ) {
    setFormValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  return (
    <form action={formAction} className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      {mode === "edit" ? <input type="hidden" name="id" value={bloqueioId} /> : null}

      {state.error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      ) : null}

      <div>
        <h2 className="text-lg font-semibold text-slate-900">Bloqueio de agenda</h2>
        <p className="mt-1 text-sm text-slate-500">
          Use para almoço, folga, médico, ausência ou outro motivo.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="md:col-span-2">
          <label className={labelClass}>Profissional *</label>
          <select
            name="profissionalId"
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
            name="data"
            type="date"
            value={formValues.data}
            onChange={(e) => setField("data", e.target.value)}
            className={inputClass}
          />
          {fieldError("data")}
        </div>

        <div>
          <label className={labelClass}>Tipo *</label>
          <select
            name="tipo"
            value={formValues.tipo}
            onChange={(e) => setField("tipo", e.target.value as TipoBloqueioAgenda)}
            className={inputClass}
          >
            {tipos.map((tipo) => (
              <option key={tipo} value={tipo}>
                {tipo}
              </option>
            ))}
          </select>
          {fieldError("tipo")}
        </div>

        <div>
          <label className={labelClass}>Hora inicial *</label>
          <input
            name="horaInicio"
            type="time"
            value={formValues.horaInicio}
            onChange={(e) => setField("horaInicio", e.target.value)}
            className={inputClass}
          />
          {fieldError("horaInicio")}
        </div>

        <div>
          <label className={labelClass}>Hora final *</label>
          <input
            name="horaFim"
            type="time"
            value={formValues.horaFim}
            onChange={(e) => setField("horaFim", e.target.value)}
            className={inputClass}
          />
          {fieldError("horaFim")}
        </div>

        <div>
          <label className={labelClass}>Cor</label>
          <div className="flex gap-3">
            <input
              name="cor"
              type="color"
              value={formValues.cor}
              onChange={(e) => setField("cor", e.target.value)}
              className="h-12 w-16 rounded-2xl border border-slate-300 bg-white p-2"
            />
            <input
              value={formValues.cor}
              onChange={(e) => setField("cor", e.target.value)}
              className={inputClass}
            />
          </div>
          {fieldError("cor")}
        </div>

        <div className="flex items-end">
          <label className="flex items-center gap-3 rounded-2xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={formValues.recorrente}
              onChange={(e) => setField("recorrente", e.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
            />
            Recorrente
          </label>
          <input type="hidden" name="recorrente" value={formValues.recorrente ? "1" : "0"} />
        </div>
      </div>

      <div>
        <label className={labelClass}>Descrição</label>
        <textarea
          name="descricao"
          value={formValues.descricao}
          onChange={(e) => setField("descricao", e.target.value)}
          className={`${inputClass} min-h-[120px] resize-y`}
          placeholder="Motivo do bloqueio"
        />
        {fieldError("descricao" as BloqueioFieldName)}
      </div>

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