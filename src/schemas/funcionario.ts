import { z } from "zod";

export const emptyFuncionarioFormValues = {
  nome: "",
  cpf: "",
  email: "",
  telefone: "",
  whatsapp: "",
  fotoUrl: "",
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
};

export type FuncionarioFormValues = typeof emptyFuncionarioFormValues;
export type FuncionarioFieldName = keyof FuncionarioFormValues;

export type FuncionarioActionState = {
  error?: string;
  fieldErrors?: Partial<Record<FuncionarioFieldName, string>>;
  fields: FuncionarioFormValues;
};

export const initialFuncionarioActionState: FuncionarioActionState = {
  fields: emptyFuncionarioFormValues,
};

function text(value: FormDataEntryValue | null) {
  return String(value || "").trim();
}

function digitsOnly(value: string) {
  return String(value || "").replace(/\D/g, "");
}

function nullableText(value?: string | null) {
  const v = String(value || "").trim();
  return v || null;
}

const funcionarioSchema = z.object({
  nome: z.string().trim().min(1, "Informe o nome."),
  cpf: z
    .string()
    .trim()
    .refine((value) => !value || digitsOnly(value).length === 11, "CPF inválido."),
  email: z
    .string()
    .trim()
    .refine(
      (value) => !value || z.string().email().safeParse(value).success,
      "E-mail inválido."
    ),
  telefone: z.string().trim(),
  whatsapp: z.string().trim(),
  fotoUrl: z
    .string()
    .trim()
    .refine(
      (value) =>
        !value ||
        value.startsWith("http://") ||
        value.startsWith("https://") ||
        value.startsWith("/uploads/"),
      "Informe uma URL válida ou use uma imagem enviada do computador."
    ),
  cep: z
    .string()
    .trim()
    .refine((value) => !value || digitsOnly(value).length === 8, "CEP inválido."),
  logradouro: z.string().trim(),
  numero: z.string().trim(),
  complemento: z.string().trim(),
  bairro: z.string().trim(),
  cidade: z.string().trim(),
  uf: z
    .string()
    .trim()
    .max(2, "UF inválida."),
  dataAdmissao: z.string().trim(),
  dataDemissao: z.string().trim(),
  observacoes: z.string().trim(),
});

export function getFirstFieldError(
  fieldErrors: Record<string, string[] | undefined>
) {
  for (const value of Object.values(fieldErrors)) {
    if (value?.[0]) return value[0];
  }
  return "Verifique os campos informados.";
}

export function parseFuncionarioFormData(formData: FormData) {
  const fields: FuncionarioFormValues = {
    nome: text(formData.get("nome")),
    cpf: text(formData.get("cpf")),
    email: text(formData.get("email")),
    telefone: text(formData.get("telefone")),
    whatsapp: text(formData.get("whatsapp")),
    fotoUrl: text(formData.get("fotoUrl")),
    cep: text(formData.get("cep")),
    logradouro: text(formData.get("logradouro")),
    numero: text(formData.get("numero")),
    complemento: text(formData.get("complemento")),
    bairro: text(formData.get("bairro")),
    cidade: text(formData.get("cidade")),
    uf: text(formData.get("uf")).toUpperCase(),
    dataAdmissao: text(formData.get("dataAdmissao")),
    dataDemissao: text(formData.get("dataDemissao")),
    observacoes: text(formData.get("observacoes")),
  };

  const parsed = funcionarioSchema.safeParse(fields);

  return {
    fields,
    parsed,
  };
}

export function toFuncionarioDbInput(values: FuncionarioFormValues) {
  return {
    nome: values.nome.trim(),
    cpf: nullableText(digitsOnly(values.cpf)),
    email: nullableText(values.email)?.toLowerCase() || null,
    telefone: nullableText(digitsOnly(values.telefone)),
    whatsapp: nullableText(digitsOnly(values.whatsapp)),
    fotoUrl: nullableText(values.fotoUrl),
    cep: nullableText(digitsOnly(values.cep)),
    logradouro: nullableText(values.logradouro),
    numero: nullableText(values.numero),
    complemento: nullableText(values.complemento),
    bairro: nullableText(values.bairro),
    cidade: nullableText(values.cidade),
    uf: nullableText(values.uf?.toUpperCase().slice(0, 2)),
    dataAdmissao: values.dataAdmissao
      ? new Date(`${values.dataAdmissao}T12:00:00`)
      : null,
    dataDemissao: values.dataDemissao
      ? new Date(`${values.dataDemissao}T12:00:00`)
      : null,
    observacoes: nullableText(values.observacoes),
  };
}

export function toInputDate(value?: Date | string | null) {
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