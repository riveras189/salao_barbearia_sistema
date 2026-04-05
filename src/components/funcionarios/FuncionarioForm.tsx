"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import FotoUploadField from "@/components/shared/FotoUploadField";
import {
  emptyFuncionarioFormValues,
  initialFuncionarioActionState,
  type FuncionarioActionState,
  type FuncionarioFieldName,
  type FuncionarioFormValues,
} from "@/schemas/funcionario";

type FuncionarioFormProps = {
  mode: "create" | "edit";
  action: (
    prevState: FuncionarioActionState,
    formData: FormData
  ) => Promise<FuncionarioActionState>;
  initialValues?: Partial<FuncionarioFormValues>;
  funcionarioId?: string;
  cancelHref?: string;
};

function digitsOnly(value: string) {
  return String(value || "").replace(/\D/g, "");
}

function maskCpf(value: string) {
  const digits = digitsOnly(value).slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return digits.replace(/(\d{3})(\d+)/, "$1.$2");
  if (digits.length <= 9) return digits.replace(/(\d{3})(\d{3})(\d+)/, "$1.$2.$3");
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, "$1.$2.$3-$4");
}

function maskPhone(value: string) {
  const digits = digitsOnly(value).slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : "";
  if (digits.length <= 6) return digits.replace(/(\d{2})(\d+)/, "($1) $2");
  if (digits.length <= 10) return digits.replace(/(\d{2})(\d{4})(\d+)/, "($1) $2-$3");
  return digits.replace(/(\d{2})(\d{5})(\d+)/, "($1) $2-$3");
}

function maskCep(value: string) {
  const digits = digitsOnly(value).slice(0, 8);
  if (digits.length <= 5) return digits;
  return digits.replace(/(\d{5})(\d+)/, "$1-$2");
}

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
        ? "Salvar funcionário"
        : "Salvar alterações"}
    </button>
  );
}

const inputClass =
  "w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900";
const labelClass = "mb-1 block text-sm font-medium text-slate-700";
const errorClass = "mt-1 text-xs font-medium text-red-600";

export default function FuncionarioForm({
  mode,
  action,
  initialValues,
  funcionarioId,
  cancelHref = "/funcionarios",
}: FuncionarioFormProps) {
  const [state, formAction] = useActionState(action, initialFuncionarioActionState);

  const hasStateFields = useMemo(() => {
    const values = Object.values(state.fields || {});
    return values.some((value) => String(value || "").trim() !== "");
  }, [state.fields]);

  const mergedValues = useMemo<FuncionarioFormValues>(
    () =>
      hasStateFields
        ? {
            ...emptyFuncionarioFormValues,
            ...initialValues,
            ...state.fields,
          }
        : {
            ...emptyFuncionarioFormValues,
            ...initialValues,
          },
    [initialValues, state.fields, hasStateFields]
  );

  const [formValues, setFormValues] = useState<FuncionarioFormValues>(mergedValues);
  const [cepLoading, setCepLoading] = useState(false);
  const [cepMessage, setCepMessage] = useState("");

  useEffect(() => {
    setFormValues(mergedValues);
  }, [mergedValues]);

  function fieldError(name: FuncionarioFieldName) {
    const message = state.fieldErrors?.[name];
    return message ? <p className={errorClass}>{message}</p> : null;
  }

  function setField<K extends keyof FuncionarioFormValues>(
    field: K,
    value: FuncionarioFormValues[K]
  ) {
    setFormValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  async function buscarCep(rawCep?: string) {
    const cep = digitsOnly(rawCep ?? formValues.cep);

    if (cep.length !== 8) {
      setCepMessage("Informe um CEP válido.");
      return;
    }

    setCepLoading(true);
    setCepMessage("");

    try {
      const response = await fetch(`/api/cep?cep=${cep}`, {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        setCepMessage(data?.error || "CEP não encontrado.");
        return;
      }

      setFormValues((prev) => ({
        ...prev,
        cep: maskCep(cep),
        logradouro: data.logradouro || "",
        complemento: prev.complemento || data.complemento || "",
        bairro: data.bairro || "",
        cidade: data.cidade || "",
        uf: (data.uf || "").toUpperCase(),
      }));

      setCepMessage("Endereço preenchido pelo CEP.");
    } catch {
      setCepMessage("Não foi possível buscar o CEP.");
    } finally {
      setCepLoading(false);
    }
  }

  return (
    <form
      action={formAction}
      className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      {mode === "edit" ? (
        <input type="hidden" name="id" value={funcionarioId} />
      ) : null}

      {state.error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      ) : null}

      <div>
        <h2 className="text-lg font-semibold text-slate-900">
          Dados do funcionário
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Preencha o cadastro principal do funcionário.
        </p>
      </div>

      <FotoUploadField
        label="Foto do funcionário"
        folder="funcionarios"
        value={formValues.fotoUrl || ""}
        onChange={(value) =>
          setField("fotoUrl", value as FuncionarioFormValues["fotoUrl"])
        }
        previewName={formValues.nome || "Funcionário"}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className="md:col-span-2">
          <label className={labelClass}>Nome *</label>
          <input
            name="nome"
            value={formValues.nome}
            onChange={(e) => setField("nome", e.target.value)}
            className={inputClass}
            placeholder="Nome completo"
          />
          {fieldError("nome")}
        </div>

        <div>
          <label className={labelClass}>CPF</label>
          <input
            name="cpf"
            value={formValues.cpf}
            onChange={(e) => setField("cpf", maskCpf(e.target.value))}
            className={inputClass}
            placeholder="000.000.000-00"
            inputMode="numeric"
            maxLength={14}
          />
          {fieldError("cpf")}
        </div>

        <div>
          <label className={labelClass}>E-mail</label>
          <input
            name="email"
            type="email"
            value={formValues.email}
            onChange={(e) => setField("email", e.target.value)}
            className={inputClass}
            placeholder="funcionario@email.com"
          />
          {fieldError("email")}
        </div>

        <div>
          <label className={labelClass}>Telefone</label>
          <input
            name="telefone"
            value={formValues.telefone}
            onChange={(e) => setField("telefone", maskPhone(e.target.value))}
            className={inputClass}
            placeholder="(00) 0000-0000"
            inputMode="numeric"
            maxLength={15}
          />
          {fieldError("telefone")}
        </div>

        <div>
          <label className={labelClass}>WhatsApp</label>
          <input
            name="whatsapp"
            value={formValues.whatsapp}
            onChange={(e) => setField("whatsapp", maskPhone(e.target.value))}
            className={inputClass}
            placeholder="(00) 00000-0000"
            inputMode="numeric"
            maxLength={15}
          />
          {fieldError("whatsapp")}
        </div>

        <div>
          <label className={labelClass}>Data de admissão</label>
          <input
            name="dataAdmissao"
            type="date"
            value={formValues.dataAdmissao}
            onChange={(e) => setField("dataAdmissao", e.target.value)}
            className={inputClass}
          />
          {fieldError("dataAdmissao")}
        </div>

        <div>
          <label className={labelClass}>Data de demissão</label>
          <input
            name="dataDemissao"
            type="date"
            value={formValues.dataDemissao}
            onChange={(e) => setField("dataDemissao", e.target.value)}
            className={inputClass}
          />
          {fieldError("dataDemissao")}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-slate-900">Endereço</h2>
        <p className="mt-1 text-sm text-slate-500">
          Ao informar o CEP, o sistema preenche logradouro, bairro, cidade e UF.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div>
          <label className={labelClass}>CEP</label>
          <div className="flex gap-2">
            <input
              name="cep"
              value={formValues.cep}
              onChange={(e) => setField("cep", maskCep(e.target.value))}
              onBlur={() => {
                const cep = digitsOnly(formValues.cep);
                if (cep.length === 8) buscarCep(cep);
              }}
              className={inputClass}
              placeholder="00000-000"
              inputMode="numeric"
              maxLength={9}
            />
            <button
              type="button"
              onClick={() => buscarCep()}
              disabled={cepLoading}
              className="shrink-0 rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-60"
            >
              {cepLoading ? "Buscando..." : "Buscar"}
            </button>
          </div>
          {fieldError("cep")}
          {cepMessage ? (
            <p
              className={`mt-1 text-xs font-medium ${
                cepMessage.includes("preenchido")
                  ? "text-emerald-600"
                  : "text-amber-600"
              }`}
            >
              {cepMessage}
            </p>
          ) : null}
        </div>

        <div className="md:col-span-2 xl:col-span-2">
          <label className={labelClass}>Logradouro</label>
          <input
            name="logradouro"
            value={formValues.logradouro}
            onChange={(e) => setField("logradouro", e.target.value)}
            className={inputClass}
            placeholder="Rua, avenida..."
          />
          {fieldError("logradouro")}
        </div>

        <div>
          <label className={labelClass}>Número</label>
          <input
            name="numero"
            value={formValues.numero}
            onChange={(e) => setField("numero", e.target.value)}
            className={inputClass}
            placeholder="Número"
          />
          {fieldError("numero")}
        </div>

        <div className="md:col-span-2 xl:col-span-2">
          <label className={labelClass}>Complemento</label>
          <input
            name="complemento"
            value={formValues.complemento}
            onChange={(e) => setField("complemento", e.target.value)}
            className={inputClass}
            placeholder="Casa, bloco, sala..."
          />
          {fieldError("complemento")}
        </div>

        <div>
          <label className={labelClass}>Bairro</label>
          <input
            name="bairro"
            value={formValues.bairro}
            onChange={(e) => setField("bairro", e.target.value)}
            className={inputClass}
            placeholder="Bairro"
          />
          {fieldError("bairro")}
        </div>

        <div>
          <label className={labelClass}>Cidade</label>
          <input
            name="cidade"
            value={formValues.cidade}
            onChange={(e) => setField("cidade", e.target.value)}
            className={inputClass}
            placeholder="Cidade"
          />
          {fieldError("cidade")}
        </div>

        <div>
          <label className={labelClass}>UF</label>
          <input
            name="uf"
            value={formValues.uf}
            onChange={(e) => setField("uf", e.target.value.toUpperCase().slice(0, 2))}
            className={inputClass}
            placeholder="SP"
            maxLength={2}
          />
          {fieldError("uf")}
        </div>
      </div>

      <div>
        <label className={labelClass}>Observações</label>
        <textarea
          name="observacoes"
          value={formValues.observacoes}
          onChange={(e) => setField("observacoes", e.target.value)}
          className={`${inputClass} min-h-[120px] resize-y`}
          placeholder="Observações internas sobre o funcionário"
        />
        {fieldError("observacoes")}
      </div>

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