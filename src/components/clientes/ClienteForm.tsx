"use client";

import Link from "next/link";
import {
  useActionState,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import type { ClienteActionState } from "@/schemas/cliente";

type ClienteFormAction = (
  prevState: ClienteActionState,
  formData: FormData
) => Promise<ClienteActionState>;

type ClienteFormProps = {
  mode: "create" | "edit";
  action: ClienteFormAction;
  cliente?: {
    id: string;
    nome?: string | null;
    cpf?: string | null;
    telefone?: string | null;
    whatsapp?: string | null;
    email?: string | null;
    fotoUrl?: string | null;
    dataNascimento?: Date | string | null;
    cep?: string | null;
    logradouro?: string | null;
    numero?: string | null;
    complemento?: string | null;
    bairro?: string | null;
    cidade?: string | null;
    uf?: string | null;
    observacoes?: string | null;
    ativo?: boolean | null;
  } | null;
};

const initialState: ClienteActionState = {};

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function maskCpf(value: string) {
  const digits = onlyDigits(value).slice(0, 11);

  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return digits.replace(/(\d{3})(\d+)/, "$1.$2");
  if (digits.length <= 9) {
    return digits.replace(/(\d{3})(\d{3})(\d+)/, "$1.$2.$3");
  }

  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, "$1.$2.$3-$4");
}

function maskPhone(value: string) {
  const digits = onlyDigits(value).slice(0, 11);

  if (digits.length <= 2) return digits;
  if (digits.length <= 6) {
    return digits.replace(/(\d{2})(\d+)/, "($1) $2");
  }
  if (digits.length <= 10) {
    return digits.replace(/(\d{2})(\d{4})(\d+)/, "($1) $2-$3");
  }

  return digits.replace(/(\d{2})(\d{5})(\d+)/, "($1) $2-$3");
}

function maskCep(value: string) {
  const digits = onlyDigits(value).slice(0, 8);

  if (digits.length <= 5) return digits;
  return digits.replace(/(\d{5})(\d+)/, "$1-$2");
}

function toInputDate(value?: Date | string | null) {
  if (!value) return "";

  if (typeof value === "string") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "";
    return parsed.toISOString().slice(0, 10);
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }

  return "";
}

function getInitials(name?: string | null) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) return "C";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function InputError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs font-medium text-rose-600">{message}</p>;
}

function SubmitButton({ mode }: { mode: "create" | "edit" }) {
  return (
    <button
      type="submit"
      className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
    >
      {mode === "create" ? "Salvar cliente" : "Salvar alterações"}
    </button>
  );
}

export default function ClienteForm({
  mode,
  action,
  cliente,
}: ClienteFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const fieldErrors = (state?.fieldErrors || {}) as Record<
    string,
    string | undefined
  >;

  const [nome, setNome] = useState(cliente?.nome || "");
  const [cpf, setCpf] = useState(maskCpf(cliente?.cpf || ""));
  const [telefone, setTelefone] = useState(maskPhone(cliente?.telefone || ""));
  const [whatsapp, setWhatsapp] = useState(maskPhone(cliente?.whatsapp || ""));
  const [fotoUrl, setFotoUrl] = useState(cliente?.fotoUrl || "");
  const [uploadError, setUploadError] = useState("");
  const [uploading, setUploading] = useState(false);

  const [cep, setCep] = useState(maskCep(cliente?.cep || ""));
  const [logradouro, setLogradouro] = useState(cliente?.logradouro || "");
  const [numero, setNumero] = useState(cliente?.numero || "");
  const [complemento, setComplemento] = useState(cliente?.complemento || "");
  const [bairro, setBairro] = useState(cliente?.bairro || "");
  const [cidade, setCidade] = useState(cliente?.cidade || "");
  const [uf, setUf] = useState(cliente?.uf || "");
  const [buscandoCep, setBuscandoCep] = useState(false);

  useEffect(() => {
    setNome(cliente?.nome || "");
    setCpf(maskCpf(cliente?.cpf || ""));
    setTelefone(maskPhone(cliente?.telefone || ""));
    setWhatsapp(maskPhone(cliente?.whatsapp || ""));
    setFotoUrl(cliente?.fotoUrl || "");
    setCep(maskCep(cliente?.cep || ""));
    setLogradouro(cliente?.logradouro || "");
    setNumero(cliente?.numero || "");
    setComplemento(cliente?.complemento || "");
    setBairro(cliente?.bairro || "");
    setCidade(cliente?.cidade || "");
    setUf(cliente?.uf || "");
  }, [cliente?.id]);

  const previewName = useMemo(() => nome || "Cliente", [nome]);

  async function handleUploadFromComputer(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadError("");

    const allowed = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!allowed.includes(file.type)) {
      setUploadError("Formato não suportado. Use JPG, PNG ou WEBP.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError("A imagem é muito grande. Máximo permitido: 5MB.");
      event.target.value = "";
      return;
    }

    try {
      setUploading(true);

      const body = new FormData();
      body.append("file", file);

      const response = await fetch("/api/upload/cliente-foto", {
        method: "POST",
        body,
      });

      const result = await response.json();

      if (!response.ok || !result?.ok || !result?.url) {
        throw new Error(result?.error || "Não foi possível enviar a imagem.");
      }

      setFotoUrl(result.url);
    } catch (error) {
      console.error(error);
      setUploadError("Não foi possível enviar a imagem do computador.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  async function buscarCep() {
    const digits = onlyDigits(cep);

    if (digits.length !== 8) {
      alert("Informe um CEP válido com 8 números.");
      return;
    }

    try {
      setBuscandoCep(true);

      const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await response.json();

      if (!response.ok || data?.erro) {
        alert("CEP não encontrado.");
        return;
      }

      setLogradouro(data.logradouro || "");
      setBairro(data.bairro || "");
      setCidade(data.localidade || "");
      setUf(data.uf || "");
    } catch (error) {
      console.error(error);
      alert("Não foi possível consultar o CEP.");
    } finally {
      setBuscandoCep(false);
    }
  }

  return (
    <form action={formAction} className="space-y-6">
      {mode === "edit" && cliente?.id ? (
        <input type="hidden" name="id" value={cliente.id} />
      ) : null}

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900">Dados do cliente</h2>
        <p className="mt-1 text-sm text-slate-500">
          Preencha os dados principais do cadastro.
        </p>

        {state?.error ? (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {state.error}
          </div>
        ) : null}

        <div className="mt-6 grid gap-6">
          <div className="grid gap-4 lg:grid-cols-[160px_1fr]">
            <div className="flex flex-col items-center gap-3">
              <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 shadow-sm">
                {fotoUrl ? (
                  <img
                    src={fotoUrl}
                    alt="Foto do cliente"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-3xl font-semibold text-slate-400">
                    {getInitials(previewName)}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center justify-center rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                disabled={uploading}
              >
                {uploading ? "Enviando..." : "Escolher do computador"}
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                className="hidden"
                onChange={handleUploadFromComputer}
              />
            </div>

            <div className="grid gap-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Foto
                </label>
                <input
                  type="text"
                  name="fotoUrl"
                  value={fotoUrl}
                  onChange={(e) => setFotoUrl(e.target.value)}
                  placeholder="https://site.com/foto.jpg ou /uploads/clientes/foto.png"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Você pode colar a URL da foto ou clicar em{" "}
                  <strong>Escolher do computador</strong>.
                </p>
                <InputError message={fieldErrors.fotoUrl} />
                {uploadError ? (
                  <p className="mt-1 text-xs font-medium text-rose-600">
                    {uploadError}
                  </p>
                ) : null}
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Nome *
                  </label>
                  <input
                    type="text"
                    name="nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Nome completo"
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500"
                  />
                  <InputError message={fieldErrors.nome} />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    CPF
                  </label>
                  <input
                    type="text"
                    name="cpf"
                    value={cpf}
                    onChange={(e) => setCpf(maskCpf(e.target.value))}
                    placeholder="000.000.000-00"
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500"
                    inputMode="numeric"
                  />
                  <InputError message={fieldErrors.cpf} />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Telefone
                  </label>
                  <input
                    type="text"
                    name="telefone"
                    value={telefone}
                    onChange={(e) => setTelefone(maskPhone(e.target.value))}
                    placeholder="(00) 00000-0000"
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500"
                    inputMode="numeric"
                  />
                  <InputError message={fieldErrors.telefone} />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    WhatsApp
                  </label>
                  <input
                    type="text"
                    name="whatsapp"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(maskPhone(e.target.value))}
                    placeholder="(00) 00000-0000"
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500"
                    inputMode="numeric"
                  />
                  <InputError message={fieldErrors.whatsapp} />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    E-mail
                  </label>
                  <input
                    type="email"
                    name="email"
                    defaultValue={cliente?.email || ""}
                    placeholder="cliente@email.com"
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500"
                  />
                  <InputError message={fieldErrors.email} />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Data de nascimento
                  </label>
                  <input
                    type="date"
                    name="dataNascimento"
                    defaultValue={toInputDate(cliente?.dataNascimento)}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500"
                  />
                  <InputError message={fieldErrors.dataNascimento} />
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-6">
            <h3 className="text-xl font-bold text-slate-900">Endereço</h3>
            <p className="mt-1 text-sm text-slate-500">
              Ao informar o CEP, o sistema preenche logradouro, bairro, cidade e
              UF.
            </p>

            <div className="mt-5 grid gap-4">
              <div className="grid gap-4 md:grid-cols-[250px_120px_1fr_320px]">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    CEP
                  </label>
                  <input
                    type="text"
                    name="cep"
                    value={cep}
                    onChange={(e) => setCep(maskCep(e.target.value))}
                    placeholder="00000-000"
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500"
                    inputMode="numeric"
                  />
                  <InputError message={fieldErrors.cep} />
                </div>

                <div className="self-end">
                  <button
                    type="button"
                    onClick={buscarCep}
                    disabled={buscandoCep}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    {buscandoCep ? "Buscando..." : "Buscar"}
                  </button>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Logradouro
                  </label>
                  <input
                    type="text"
                    name="logradouro"
                    value={logradouro}
                    onChange={(e) => setLogradouro(e.target.value)}
                    placeholder="Rua, avenida..."
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500"
                  />
                  <InputError message={fieldErrors.logradouro} />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Número
                  </label>
                  <input
                    type="text"
                    name="numero"
                    value={numero}
                    onChange={(e) => setNumero(e.target.value)}
                    placeholder="Número"
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500"
                  />
                  <InputError message={fieldErrors.numero} />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-[1.3fr_0.65fr_0.65fr_0.65fr]">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Complemento
                  </label>
                  <input
                    type="text"
                    name="complemento"
                    value={complemento}
                    onChange={(e) => setComplemento(e.target.value)}
                    placeholder="Casa, bloco, sala..."
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500"
                  />
                  <InputError message={fieldErrors.complemento} />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Bairro
                  </label>
                  <input
                    type="text"
                    name="bairro"
                    value={bairro}
                    onChange={(e) => setBairro(e.target.value)}
                    placeholder="Bairro"
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500"
                  />
                  <InputError message={fieldErrors.bairro} />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Cidade
                  </label>
                  <input
                    type="text"
                    name="cidade"
                    value={cidade}
                    onChange={(e) => setCidade(e.target.value)}
                    placeholder="Cidade"
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500"
                  />
                  <InputError message={fieldErrors.cidade} />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    UF
                  </label>
                  <input
                    type="text"
                    name="uf"
                    value={uf}
                    onChange={(e) => setUf(e.target.value.toUpperCase().slice(0, 2))}
                    placeholder="UF"
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm uppercase text-slate-900 outline-none transition focus:border-slate-500"
                  />
                  <InputError message={fieldErrors.uf} />
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-6">
            <h3 className="text-xl font-bold text-slate-900">Observações</h3>

            <div className="mt-4">
              <textarea
                name="observacoes"
                defaultValue={cliente?.observacoes || ""}
                rows={5}
                placeholder="Digite observações sobre o cliente..."
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500"
              />
              <InputError message={fieldErrors.observacoes} />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/clientes"
          className="inline-flex items-center justify-center rounded-2xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Voltar
        </Link>

        <SubmitButton mode={mode} />

        {pending ? (
          <span className="text-sm text-slate-500">Salvando...</span>
        ) : null}
      </div>
    </form>
  );
}