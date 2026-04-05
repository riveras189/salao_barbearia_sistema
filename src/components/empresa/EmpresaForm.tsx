"use client";

import { useEffect, useState } from "react";

type EmpresaFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  empresa?: any;
};

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function maskCnpj(value: string) {
  const digits = onlyDigits(value).slice(0, 14);

  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

function maskCep(value: string) {
  const digits = onlyDigits(value).slice(0, 8);
  return digits.replace(/^(\d{5})(\d)/, "$1-$2");
}

function maskPhone(value: string) {
  const digits = onlyDigits(value).slice(0, 11);

  if (digits.length <= 10) {
    return digits
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }

  return digits
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
}

export default function EmpresaForm({
  action,
  empresa,
}: EmpresaFormProps) {
  const [form, setForm] = useState({
    id: empresa?.id ?? "",
    razaoSocial: empresa?.razaoSocial ?? "",
    nomeFantasia: empresa?.nomeFantasia ?? "",
    cnpj: empresa?.cnpj ? maskCnpj(empresa.cnpj) : "",
    email: empresa?.email ?? "",
    telefone: empresa?.telefone ? maskPhone(empresa.telefone) : "",
    whatsapp: empresa?.whatsapp ? maskPhone(empresa.whatsapp) : "",
    cep: empresa?.cep ? maskCep(empresa.cep) : "",
    logradouro: empresa?.logradouro ?? "",
    numero: empresa?.numero ?? "",
    complemento: empresa?.complemento ?? "",
    bairro: empresa?.bairro ?? "",
    cidade: empresa?.cidade ?? "",
    uf: empresa?.uf ?? "",
    descricaoPublica: empresa?.descricaoPublica ?? "",
    missao: empresa?.missao ?? "",
    valores: empresa?.valores ?? "",
    corPrimaria: empresa?.corPrimaria || "#0f172a",
    corSecundaria: empresa?.corSecundaria || "#334155",
    ativo: empresa?.ativo ?? true,
  });

  const [loadingCep, setLoadingCep] = useState(false);
  const [cepError, setCepError] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>(empresa?.logoUrl || "");

  useEffect(() => {
    if (!logoFile) return;

    const objectUrl = URL.createObjectURL(logoFile);
    setLogoPreview(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [logoFile]);

  function setField(name: string, value: string | boolean) {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleInputChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = event.target;
    setField(name, value);
  }

  async function buscarCep(rawCep?: string) {
    const cepDigits = onlyDigits(rawCep ?? String(form.cep ?? ""));

    if (cepDigits.length !== 8) return;

    setLoadingCep(true);
    setCepError("");

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepDigits}/json/`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Falha ao consultar o CEP.");
      }

      const data = await response.json();

      if (data?.erro) {
        setCepError("CEP não encontrado.");
        return;
      }

      setForm((prev) => ({
        ...prev,
        logradouro: data?.logradouro || "",
        bairro: data?.bairro || "",
        cidade: data?.localidade || "",
        uf: data?.uf || "",
        complemento: prev.complemento || data?.complemento || "",
      }));
    } catch {
      setCepError("Não foi possível buscar o endereço pelo CEP.");
    } finally {
      setLoadingCep(false);
    }
  }

  return (
    <form action={action} className="space-y-6">
      {form.id ? <input type="hidden" name="id" value={form.id} /> : null}

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Logo da empresa</h2>

        <div className="mt-5 flex flex-col gap-5 md:flex-row md:items-center">
          <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-3xl border border-slate-200 bg-slate-50">
            {logoPreview ? (
              <img
                src={logoPreview}
                alt="Logo da empresa"
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-xs text-slate-400">Sem logo</span>
            )}
          </div>

          <div className="flex-1">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Enviar logo
            </label>
            <input
              type="file"
              name="logo"
              accept="image/png,image/jpeg"
              onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
              className="block w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 file:mr-4 file:rounded-xl file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
            />
            <p className="mt-2 text-xs text-slate-500">
              Use PNG ou JPG. Essa logo também será usada nos relatórios PDF e Excel.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Dados principais</h2>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Razão social
            </label>
            <input
              name="razaoSocial"
              value={form.razaoSocial}
              onChange={handleInputChange}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-900"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Nome fantasia
            </label>
            <input
              name="nomeFantasia"
              value={form.nomeFantasia}
              onChange={handleInputChange}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-900"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              CNPJ
            </label>
            <input
              name="cnpj"
              value={form.cnpj}
              onChange={(e) => setField("cnpj", maskCnpj(e.target.value))}
              inputMode="numeric"
              placeholder="00.000.000/0000-00"
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-900"
            />
          </div>

          <div className="flex items-center gap-3 pt-8">
            <input
              id="ativo"
              name="ativo"
              type="checkbox"
              checked={Boolean(form.ativo)}
              onChange={(e) => setField("ativo", e.target.checked)}
              className="h-5 w-5 rounded border-slate-300"
            />
            <label htmlFor="ativo" className="text-sm font-medium text-slate-700">
              Empresa ativa
            </label>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Contato</h2>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              E-mail
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleInputChange}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-900"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Telefone
            </label>
            <input
              name="telefone"
              value={form.telefone}
              onChange={(e) => setField("telefone", maskPhone(e.target.value))}
              inputMode="numeric"
              placeholder="(17) 3222-0000"
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-900"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              WhatsApp
            </label>
            <input
              name="whatsapp"
              value={form.whatsapp}
              onChange={(e) => setField("whatsapp", maskPhone(e.target.value))}
              inputMode="numeric"
              placeholder="(17) 99999-0000"
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-900"
            />
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Endereço</h2>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              CEP
            </label>
            <input
              name="cep"
              value={form.cep}
              onChange={(e) => {
                const masked = maskCep(e.target.value);
                setField("cep", masked);

                if (onlyDigits(masked).length === 8) {
                  void buscarCep(masked);
                }
              }}
              onBlur={() => void buscarCep(form.cep)}
              inputMode="numeric"
              placeholder="00000-000"
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-900"
            />
            <div className="mt-2 min-h-5 text-xs">
              {loadingCep ? (
                <span className="text-slate-500">Buscando endereço...</span>
              ) : cepError ? (
                <span className="text-red-600">{cepError}</span>
              ) : (
                <span className="text-slate-500">
                  Ao informar o CEP, o endereço é preenchido automaticamente.
                </span>
              )}
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Logradouro
            </label>
            <input
              name="logradouro"
              value={form.logradouro}
              onChange={handleInputChange}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-900"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Número
            </label>
            <input
              name="numero"
              value={form.numero}
              onChange={handleInputChange}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-900"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Complemento
            </label>
            <input
              name="complemento"
              value={form.complemento}
              onChange={handleInputChange}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-900"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Bairro
            </label>
            <input
              name="bairro"
              value={form.bairro}
              onChange={handleInputChange}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-900"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Cidade
            </label>
            <input
              name="cidade"
              value={form.cidade}
              onChange={handleInputChange}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-900"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              UF
            </label>
            <input
              name="uf"
              maxLength={2}
              value={form.uf}
              onChange={(e) => setField("uf", e.target.value.toUpperCase())}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 uppercase outline-none transition focus:border-slate-900"
            />
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Apresentação</h2>

        <div className="mt-5 grid grid-cols-1 gap-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Descrição pública
            </label>
            <textarea
              name="descricaoPublica"
              value={form.descricaoPublica}
              onChange={handleInputChange}
              rows={4}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-900"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Missão
            </label>
            <textarea
              name="missao"
              value={form.missao}
              onChange={handleInputChange}
              rows={3}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-900"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Valores
            </label>
            <textarea
              name="valores"
              value={form.valores}
              onChange={handleInputChange}
              rows={3}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-900"
            />
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          Aparência do sistema
        </h2>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Cor primária
            </label>
            <input
              type="color"
              name="corPrimaria"
              value={form.corPrimaria}
              onChange={handleInputChange}
              className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-2 py-2"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Cor secundária
            </label>
            <input
              type="color"
              name="corSecundaria"
              value={form.corSecundaria}
              onChange={handleInputChange}
              className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-2 py-2"
            />
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
        >
          Salvar empresa
        </button>
      </div>
    </form>
  );
}