import { z } from "zod";

export const clienteFieldNames = [
  "nome",
  "cpf",
  "telefone",
  "whatsapp",
  "email",
  "dataNascimento",
  "cep",
  "logradouro",
  "numero",
  "complemento",
  "bairro",
  "cidade",
  "uf",
  "observacoes",
] as const;

export type ClienteFieldName = (typeof clienteFieldNames)[number];

export type ClienteFormValues = {
  nome: string;
  cpf: string;
  telefone: string;
  whatsapp: string;
  email: string;
  dataNascimento: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
  observacoes: string;
};

export type ClienteActionState = {
  error?: string;
  fieldErrors?: Partial<Record<ClienteFieldName, string>>;
  fields?: ClienteFormValues;
};

export const emptyClienteFormValues: ClienteFormValues = {
  nome: "",
  cpf: "",
  telefone: "",
  whatsapp: "",
  email: "",
  dataNascimento: "",
  cep: "",
  logradouro: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  uf: "",
  observacoes: "",
};

export const initialClienteActionState: ClienteActionState = {};

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

const clienteSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(3, "Informe o nome do cliente.")
    .max(150, "O nome deve ter no máximo 150 caracteres."),

  cpf: z
    .preprocess(emptyToUndefined, z.string().length(11, "CPF inválido.").optional())
    .optional(),

  telefone: z
    .preprocess(emptyToUndefined, z.string().max(20, "Telefone inválido.").optional())
    .optional(),

  whatsapp: z
    .preprocess(emptyToUndefined, z.string().max(20, "WhatsApp inválido.").optional())
    .optional(),

  email: z
    .preprocess(
      emptyToUndefined,
      z.string().email("E-mail inválido.").max(150, "E-mail muito longo.").optional()
    )
    .optional(),

  dataNascimento: z
    .preprocess(
      emptyToUndefined,
      z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Data de nascimento inválida.")
        .optional()
    )
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
      z
        .string()
        .trim()
        .toUpperCase()
        .max(2, "UF inválida.")
        .optional()
    )
    .optional(),

  observacoes: z
    .preprocess(emptyToUndefined, z.string().max(1000, "Observação muito longa.").optional())
    .optional(),
});

export function parseClienteFormData(formData: FormData) {
  const fields: ClienteFormValues = {
    nome: String(formData.get("nome") || "").trim(),
    cpf: digitsOnly(String(formData.get("cpf") || "")),
    telefone: digitsOnly(String(formData.get("telefone") || "")),
    whatsapp: digitsOnly(String(formData.get("whatsapp") || "")),
    email: String(formData.get("email") || "").trim().toLowerCase(),
    dataNascimento: String(formData.get("dataNascimento") || "").trim(),
    cep: digitsOnly(String(formData.get("cep") || "")),
    logradouro: String(formData.get("logradouro") || "").trim(),
    numero: String(formData.get("numero") || "").trim(),
    complemento: String(formData.get("complemento") || "").trim(),
    bairro: String(formData.get("bairro") || "").trim(),
    cidade: String(formData.get("cidade") || "").trim(),
    uf: String(formData.get("uf") || "").trim().toUpperCase(),
    observacoes: String(formData.get("observacoes") || "").trim(),
  };

  const parsed = clienteSchema.safeParse(fields);

  return { fields, parsed };
}

export function getFirstFieldError(
  errors: Partial<Record<ClienteFieldName, string[] | undefined>>
) {
  for (const field of clienteFieldNames) {
    const first = errors[field]?.[0];
    if (first) return first;
  }
  return "Verifique os dados informados.";
}

export function toClienteDbInput(values: ClienteFormValues) {
  return {
    nome: values.nome.trim(),
    cpf: emptyToNull(values.cpf),
    telefone: emptyToNull(values.telefone),
    whatsapp: emptyToNull(values.whatsapp),
    email: emptyToNull(values.email.toLowerCase()),
    dataNascimento: values.dataNascimento
      ? new Date(`${values.dataNascimento}T12:00:00.000Z`)
      : null,
    cep: emptyToNull(values.cep),
    logradouro: emptyToNull(values.logradouro),
    numero: emptyToNull(values.numero),
    complemento: emptyToNull(values.complemento),
    bairro: emptyToNull(values.bairro),
    cidade: emptyToNull(values.cidade),
    uf: emptyToNull(values.uf.toUpperCase()),
    observacoes: emptyToNull(values.observacoes),
  };
}

export function toInputDate(value?: Date | string | null) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}