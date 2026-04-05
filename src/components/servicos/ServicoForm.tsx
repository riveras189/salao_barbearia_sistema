"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  emptyServicoFormValues,
  initialServicoActionState,
  type ServicoActionState,
  type ServicoFieldName,
  type ServicoFormValues,
} from "@/schemas/servico";

type ProfissionalOption = {
  id: string;
  nome: string;
  ativo: boolean;
};

type ServicoFormProps = {
  mode: "create" | "edit";
  action: (
    prevState: ServicoActionState,
    formData: FormData
  ) => Promise<ServicoActionState>;
  initialValues?: Partial<ServicoFormValues>;
  servicoId?: string;
  cancelHref?: string;
  profissionais: ProfissionalOption[];
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
        ? "Salvar serviço"
        : "Salvar alterações"}
    </button>
  );
}

const inputClass =
  "w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900";
const labelClass = "mb-1 block text-sm font-medium text-slate-700";
const errorClass = "mt-1 text-xs font-medium text-red-600";

export default function ServicoForm({
  mode,
  action,
  initialValues,
  servicoId,
  cancelHref = "/servicos",
  profissionais,
}: ServicoFormProps) {
  const [state, formAction] = useActionState(action, initialServicoActionState);

  const mergedValues = useMemo<ServicoFormValues>(
    () => ({
      ...emptyServicoFormValues,
      ...initialValues,
      ...state.fields,
      profissionalIds: state.fields?.profissionalIds ?? initialValues?.profissionalIds ?? [],
    }),
    [initialValues, state.fields]
  );

  const [formValues, setFormValues] = useState<ServicoFormValues>(mergedValues);

  useEffect(() => {
    setFormValues(mergedValues);
  }, [mergedValues]);

  function fieldError(name: ServicoFieldName) {
    const message = state.fieldErrors?.[name];
    return message ? <p className={errorClass}>{message}</p> : null;
  }

  function setField<K extends keyof ServicoFormValues>(
    field: K,
    value: ServicoFormValues[K]
  ) {
    setFormValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function toggleProfissional(id: string) {
    setFormValues((prev) => {
      const exists = prev.profissionalIds.includes(id);
      return {
        ...prev,
        profissionalIds: exists
          ? prev.profissionalIds.filter((item) => item !== id)
          : [...prev.profissionalIds, id],
      };
    });
  }

  return (
    <form
      action={formAction}
      className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      {mode === "edit" ? <input type="hidden" name="id" value={servicoId} /> : null}

      {state.error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      ) : null}

      <div>
        <h2 className="text-lg font-semibold text-slate-900">Dados do serviço</h2>
        <p className="mt-1 text-sm text-slate-500">
          Configure nome, duração, preço, comissão e exibição no site.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="md:col-span-2 xl:col-span-2">
          <label className={labelClass}>Nome *</label>
          <input
            name="nome"
            value={formValues.nome}
            onChange={(e) => setField("nome", e.target.value)}
            className={inputClass}
            placeholder="Ex.: Corte masculino"
          />
          {fieldError("nome")}
        </div>

        <div>
          <label className={labelClass}>Categoria</label>
          <input
            name="categoriaNome"
            value={formValues.categoriaNome}
            onChange={(e) => setField("categoriaNome", e.target.value)}
            className={inputClass}
            placeholder="Ex.: Cortes"
          />
          {fieldError("categoriaNome")}
        </div>

        <div>
          <label className={labelClass}>Duração (min) *</label>
          <input
            name="duracaoMin"
            value={formValues.duracaoMin}
            onChange={(e) => setField("duracaoMin", e.target.value.replace(/\D/g, ""))}
            className={inputClass}
            placeholder="30"
            inputMode="numeric"
          />
          {fieldError("duracaoMin")}
        </div>

        <div>
          <label className={labelClass}>Preço (R$) *</label>
          <input
            name="preco"
            value={formValues.preco}
            onChange={(e) => setField("preco", e.target.value)}
            className={inputClass}
            placeholder="49,90"
          />
          {fieldError("preco")}
        </div>

        <div>
          <label className={labelClass}>Comissão (%) *</label>
          <input
            name="comissaoPercentualPadrao"
            value={formValues.comissaoPercentualPadrao}
            onChange={(e) => setField("comissaoPercentualPadrao", e.target.value)}
            className={inputClass}
            placeholder="40"
          />
          {fieldError("comissaoPercentualPadrao")}
        </div>

        <div className="flex items-end">
          <label className="flex items-center gap-3 rounded-2xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={formValues.exibirNoSite}
              onChange={(e) => setField("exibirNoSite", e.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
            />
            Exibir no site
          </label>
          <input
            type="hidden"
            name="exibirNoSite"
            value={formValues.exibirNoSite ? "1" : "0"}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Descrição</label>
        <textarea
          name="descricao"
          value={formValues.descricao}
          onChange={(e) => setField("descricao", e.target.value)}
          className={`${inputClass} min-h-[120px] resize-y`}
          placeholder="Descrição do serviço"
        />
        {fieldError("descricao" as ServicoFieldName)}
      </div>

      <div>
        <h2 className="text-lg font-semibold text-slate-900">Profissionais habilitados</h2>
        <p className="mt-1 text-sm text-slate-500">
          Marque quais profissionais podem executar este serviço.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {profissionais.map((profissional) => {
          const checked = formValues.profissionalIds.includes(profissional.id);

          return (
            <label
              key={profissional.id}
              className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 p-4 hover:bg-slate-50"
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggleProfissional(profissional.id)}
                className="h-4 w-4 rounded border-slate-300"
              />
              <span className="flex-1 text-sm font-medium text-slate-800">
                {profissional.nome}
              </span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  profissional.ativo
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-200 text-slate-700"
                }`}
              >
                {profissional.ativo ? "Ativo" : "Inativo"}
              </span>
            </label>
          );
        })}
      </div>

      {formValues.profissionalIds.map((id) => (
        <input key={id} type="hidden" name="profissionalIds" value={id} />
      ))}

      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton mode={mode} />

        <Link
          href={cancelHref}
          className="inline-flex items-center justify-center rounded-2xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          Voltar
        </Link>
      </div>
    </form>
  );
}