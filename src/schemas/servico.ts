import { z } from "zod";

export const servicoFieldNames = [
  "nome",
  "descricao",
  "duracaoMin",
  "preco",
  "comissaoPercentualPadrao",
  "categoriaNome",
] as const;

export type ServicoFieldName = (typeof servicoFieldNames)[number];

export type ServicoFormValues = {
  nome: string;
  descricao: string;
  duracaoMin: string;
  preco: string;
  comissaoPercentualPadrao: string;
  categoriaNome: string;
  exibirNoSite: boolean;
  profissionalIds: string[];
};

export type ServicoActionState = {
  error?: string;
  fieldErrors?: Partial<Record<ServicoFieldName, string>>;
  fields?: ServicoFormValues;
};

export const emptyServicoFormValues: ServicoFormValues = {
  nome: "",
  descricao: "",
  duracaoMin: "30",
  preco: "",
  comissaoPercentualPadrao: "0",
  categoriaNome: "",
  exibirNoSite: true,
  profissionalIds: [],
};

export const initialServicoActionState: ServicoActionState = {};

function emptyToUndefined(value: unknown) {
  const text = String(value ?? "").trim();
  return text === "" ? undefined : text;
}

function parseDecimalBR(value: string) {
  const normalized = String(value || "").trim().replace(/\./g, "").replace(",", ".");
  const num = Number(normalized);
  return Number.isFinite(num) ? num : NaN;
}

const servicoSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(2, "Informe o nome do serviço.")
    .max(150, "O nome deve ter no máximo 150 caracteres."),

  descricao: z
    .preprocess(emptyToUndefined, z.string().max(1000, "Descrição muito longa.").optional())
    .optional(),

  duracaoMin: z
    .string()
    .trim()
    .refine((v) => /^\d+$/.test(v), "Duração inválida.")
    .refine((v) => Number(v) >= 5, "A duração mínima é 5 minutos.")
    .refine((v) => Number(v) <= 600, "A duração máxima é 600 minutos."),

  preco: z
    .string()
    .trim()
    .refine((v) => !Number.isNaN(parseDecimalBR(v)), "Preço inválido.")
    .refine((v) => parseDecimalBR(v) >= 0, "Preço não pode ser negativo."),

  comissaoPercentualPadrao: z
    .string()
    .trim()
    .refine((v) => !Number.isNaN(parseDecimalBR(v)), "Comissão inválida.")
    .refine((v) => parseDecimalBR(v) >= 0, "Comissão não pode ser negativa.")
    .refine((v) => parseDecimalBR(v) <= 100, "Comissão não pode ser maior que 100%."),

  categoriaNome: z
    .preprocess(emptyToUndefined, z.string().max(120, "Categoria muito longa.").optional())
    .optional(),
});

export function parseServicoFormData(formData: FormData) {
  const fields: ServicoFormValues = {
    nome: String(formData.get("nome") || "").trim(),
    descricao: String(formData.get("descricao") || "").trim(),
    duracaoMin: String(formData.get("duracaoMin") || "").trim(),
    preco: String(formData.get("preco") || "").trim(),
    comissaoPercentualPadrao: String(formData.get("comissaoPercentualPadrao") || "").trim(),
    categoriaNome: String(formData.get("categoriaNome") || "").trim(),
    exibirNoSite: String(formData.get("exibirNoSite") || "") === "1",
    profissionalIds: formData
      .getAll("profissionalIds")
      .map((item) => String(item))
      .filter(Boolean),
  };

  const parsed = servicoSchema.safeParse(fields);
  return { fields, parsed };
}

export function getFirstFieldError(
  errors: Partial<Record<ServicoFieldName, string[] | undefined>>
) {
  for (const field of servicoFieldNames) {
    const first = errors[field]?.[0];
    if (first) return first;
  }
  return "Verifique os dados informados.";
}

export function toServicoDbInput(values: ServicoFormValues) {
  return {
    nome: values.nome.trim(),
    descricao: values.descricao.trim() || null,
    duracaoMin: Number(values.duracaoMin),
    preco: parseDecimalBR(values.preco),
    comissaoPercentualPadrao: parseDecimalBR(values.comissaoPercentualPadrao),
    exibirNoSite: values.exibirNoSite,
  };
}