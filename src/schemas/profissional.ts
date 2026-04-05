import { z } from "zod";

export const profissionalFieldNames = [
  "nome",
  "cpf",
  "cnpj",
  "email",
  "telefone",
  "whatsapp",
  "cep",
  "logradouro",
  "numero",
  "complemento",
  "bairro",
  "cidade",
  "uf",
  "dataAdmissao",
  "dataDemissao",
  "observacoes",
  "corAgenda",
] as const;

export type ProfissionalFieldName = (typeof profissionalFieldNames)[number];

export type ProfissionalFormValues = {
  nome: string;
  cpf: string;
  cnpj: string;
  email: string;
  telefone: string;
  whatsapp: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
  dataAdmissao: string;
  dataDemissao: string;
  observacoes: string;
  corAgenda: string;
};

export type ProfissionalActionState = {
  error?: string;
  fieldErrors?: Partial<Record<ProfissionalFieldName, string>>;
  fields?: ProfissionalFormValues;
};

export const emptyProfissionalFormValues: ProfissionalFormValues = {
  nome: "",
  cpf: "",
  cnpj: "",
  email: "",
  telefone: "",
  whatsapp: "",
  cep: "",
  logradouro: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  uf: "",
  dataAdmissao: "",
  dataDemissao: "",
  observacoes: "",
  corAgenda: "#1d4ed8",
};

export const initialProfissionalActionState: ProfissionalActionState = {};

function digitsOnly(value: string) {
  return String(value || "").replace(/\D/g, "");
}

function emptyToUndefined(value: unknown) {
  const text = String(value ?? "").trim();
  return text === "" ? undefined : text;
}

function emptyToNull(value?: string) {
  const text = String(value ?? "").trim();
  return text === "" ? null : text;
}

const profissionalSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(3, "Informe o nome do profissional.")
    .max(150, "O nome deve ter no máximo 150 caracteres."),

  cpf: z
    .preprocess(emptyToUndefined, z.string().length(11, "CPF inválido.").optional())
    .optional(),

  cnpj: z
    .preprocess(emptyToUndefined, z.string().length(14, "CNPJ inválido.").optional())
    .optional(),

  email: z
    .preprocess(
      emptyToUndefined,
      z.string().email("E-mail inválido.").max(150, "E-mail muito longo.").optional()
    )
    .optional(),

  telefone: z
    .preprocess(emptyToUndefined, z.string().max(20, "Telefone inválido.").optional())
    .optional(),

  whatsapp: z
    .preprocess(emptyToUndefined, z.string().max(20, "WhatsApp inválido.").optional())
    .optional(),

  cep: z
    .preprocess(emptyToUndefined, z.string().max(8, "CEP inválido.").optional())
    .optional(),

  logradouro: z
    .preprocess(emptyToUndefined, z.string().max(150, "Logradouro muito longo.").optional())
    .optional(),

  numero: z
    .preprocess(emptyToUndefined, z.string().max(20, "Número muito longo.").optional())
    .optional(),

  complemento: z
    .preprocess(emptyToUndefined, z.string().max(120, "Complemento muito longo.").optional())
    .optional(),

  bairro: z
    .preprocess(emptyToUndefined, z.string().max(120, "Bairro muito longo.").optional())
    .optional(),

  cidade: z
    .preprocess(emptyToUndefined, z.string().max(120, "Cidade muito longa.").optional())
    .optional(),

  uf: z
    .preprocess(
      emptyToUndefined,
      z.string().trim().toUpperCase().max(2, "UF inválida.").optional()
    )
    .optional(),

  dataAdmissao: z
    .preprocess(
      emptyToUndefined,
      z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data de admissão inválida.").optional()
    )
    .optional(),

  dataDemissao: z
    .preprocess(
      emptyToUndefined,
      z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data de demissão inválida.").optional()
    )
    .optional(),

  observacoes: z
    .preprocess(emptyToUndefined, z.string().max(1000, "Observação muito longa.").optional())
    .optional(),

  corAgenda: z
    .preprocess(
      emptyToUndefined,
      z.string().regex(/^#([0-9a-fA-F]{6})$/, "Cor da agenda inválida.").optional()
    )
    .optional(),
});

export function parseProfissionalFormData(formData: FormData) {
  const fields: ProfissionalFormValues = {
    nome: String(formData.get("nome") || "").trim(),
    cpf: digitsOnly(String(formData.get("cpf") || "")),
    cnpj: digitsOnly(String(formData.get("cnpj") || "")),
    email: String(formData.get("email") || "").trim().toLowerCase(),
    telefone: digitsOnly(String(formData.get("telefone") || "")),
    whatsapp: digitsOnly(String(formData.get("whatsapp") || "")),
    cep: digitsOnly(String(formData.get("cep") || "")),
    logradouro: String(formData.get("logradouro") || "").trim(),
    numero: String(formData.get("numero") || "").trim(),
    complemento: String(formData.get("complemento") || "").trim(),
    bairro: String(formData.get("bairro") || "").trim(),
    cidade: String(formData.get("cidade") || "").trim(),
    uf: String(formData.get("uf") || "").trim().toUpperCase(),
    dataAdmissao: String(formData.get("dataAdmissao") || "").trim(),
    dataDemissao: String(formData.get("dataDemissao") || "").trim(),
    observacoes: String(formData.get("observacoes") || "").trim(),
    corAgenda: String(formData.get("corAgenda") || "").trim() || "#1d4ed8",
  };

  const parsed = profissionalSchema.safeParse(fields);
  return { fields, parsed };
}

export function getFirstFieldError(
  errors: Partial<Record<ProfissionalFieldName, string[] | undefined>>
) {
  for (const field of profissionalFieldNames) {
    const first = errors[field]?.[0];
    if (first) return first;
  }
  return "Verifique os dados informados.";
}

export function toProfissionalDbInput(values: ProfissionalFormValues) {
  return {
    nome: values.nome.trim(),
    cpf: emptyToNull(values.cpf),
    cnpj: emptyToNull(values.cnpj),
    email: emptyToNull(values.email.toLowerCase()),
    telefone: emptyToNull(values.telefone),
    whatsapp: emptyToNull(values.whatsapp),
    cep: emptyToNull(values.cep),
    logradouro: emptyToNull(values.logradouro),
    numero: emptyToNull(values.numero),
    complemento: emptyToNull(values.complemento),
    bairro: emptyToNull(values.bairro),
    cidade: emptyToNull(values.cidade),
    uf: emptyToNull(values.uf.toUpperCase()),
    dataAdmissao: values.dataAdmissao
      ? new Date(`${values.dataAdmissao}T12:00:00.000Z`)
      : null,
    dataDemissao: values.dataDemissao
      ? new Date(`${values.dataDemissao}T12:00:00.000Z`)
      : null,
    observacoes: emptyToNull(values.observacoes),
    corAgenda: emptyToNull(values.corAgenda),
  };
}

export function toInputDate(value?: Date | string | null) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

export const diasSemana = [
  { value: 1, label: "Segunda" },
  { value: 2, label: "Terça" },
  { value: 3, label: "Quarta" },
  { value: 4, label: "Quinta" },
  { value: 5, label: "Sexta" },
  { value: 6, label: "Sábado" },
  { value: 0, label: "Domingo" },
] as const;