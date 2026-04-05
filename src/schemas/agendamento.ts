import { z } from "zod";
import { TipoBloqueioAgenda } from "@prisma/client";

export const agendamentoFieldNames = [
  "clienteId",
  "profissionalId",
  "data",
  "horaInicio",
  "servicoIds",
  "observacoes",
] as const;

export type AgendamentoFieldName = (typeof agendamentoFieldNames)[number];

export type AgendamentoFormValues = {
  clienteId: string;
  profissionalId: string;
  data: string;
  horaInicio: string;
  servicoIds: string[];
  observacoes: string;
  encaixe: boolean;
};

export type AgendamentoActionState = {
  error?: string;
  fieldErrors?: Partial<Record<AgendamentoFieldName, string>>;
  fields?: AgendamentoFormValues;
};

export const emptyAgendamentoFormValues: AgendamentoFormValues = {
  clienteId: "",
  profissionalId: "",
  data: "",
  horaInicio: "",
  servicoIds: [],
  observacoes: "",
  encaixe: false,
};

export const initialAgendamentoActionState: AgendamentoActionState = {};

const agendamentoSchema = z.object({
  clienteId: z.string().trim().min(1, "Selecione o cliente."),
  profissionalId: z.string().trim().min(1, "Selecione o profissional."),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida."),
  horaInicio: z.string().regex(/^\d{2}:\d{2}$/, "Hora inválida."),
  servicoIds: z.array(z.string()).min(1, "Selecione pelo menos um serviço."),
  observacoes: z.string().max(1000, "Observação muito longa."),
  encaixe: z.boolean(),
});

export function parseAgendamentoFormData(formData: FormData) {
  const fields: AgendamentoFormValues = {
    clienteId: String(formData.get("clienteId") || "").trim(),
    profissionalId: String(formData.get("profissionalId") || "").trim(),
    data: String(formData.get("data") || "").trim(),
    horaInicio: String(formData.get("horaInicio") || "").trim(),
    servicoIds: formData
      .getAll("servicoIds")
      .map((item) => String(item))
      .filter(Boolean),
    observacoes: String(formData.get("observacoes") || "").trim(),
    encaixe: String(formData.get("encaixe") || "") === "1",
  };

  const parsed = agendamentoSchema.safeParse(fields);
  return { fields, parsed };
}

export function getFirstAgendamentoError(
  errors: Partial<Record<AgendamentoFieldName, string[] | undefined>>
) {
  for (const field of agendamentoFieldNames) {
    const first = errors[field]?.[0];
    if (first) return first;
  }
  return "Verifique os dados do agendamento.";
}

export const bloqueioFieldNames = [
  "profissionalId",
  "data",
  "horaInicio",
  "horaFim",
  "tipo",
  "descricao",
  "cor",
] as const;

export type BloqueioFieldName = (typeof bloqueioFieldNames)[number];

export type BloqueioFormValues = {
  profissionalId: string;
  data: string;
  horaInicio: string;
  horaFim: string;
  tipo: TipoBloqueioAgenda;
  descricao: string;
  cor: string;
  recorrente: boolean;
};

export type BloqueioActionState = {
  error?: string;
  fieldErrors?: Partial<Record<BloqueioFieldName, string>>;
  fields?: BloqueioFormValues;
};

export const emptyBloqueioFormValues: BloqueioFormValues = {
  profissionalId: "",
  data: "",
  horaInicio: "",
  horaFim: "",
  tipo: TipoBloqueioAgenda.OUTRO,
  descricao: "",
  cor: "#fecaca",
  recorrente: false,
};

export const initialBloqueioActionState: BloqueioActionState = {};

const bloqueioSchema = z.object({
  profissionalId: z.string().trim().min(1, "Selecione o profissional."),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida."),
  horaInicio: z.string().regex(/^\d{2}:\d{2}$/, "Hora inicial inválida."),
  horaFim: z.string().regex(/^\d{2}:\d{2}$/, "Hora final inválida."),
  tipo: z.nativeEnum(TipoBloqueioAgenda),
  descricao: z.string().max(1000, "Descrição muito longa."),
  cor: z.string().regex(/^#([0-9a-fA-F]{6})$/, "Cor inválida."),
  recorrente: z.boolean(),
});

export function parseBloqueioFormData(formData: FormData) {
  const fields: BloqueioFormValues = {
    profissionalId: String(formData.get("profissionalId") || "").trim(),
    data: String(formData.get("data") || "").trim(),
    horaInicio: String(formData.get("horaInicio") || "").trim(),
    horaFim: String(formData.get("horaFim") || "").trim(),
    tipo:
      (String(formData.get("tipo") || "").trim() as TipoBloqueioAgenda) ||
      TipoBloqueioAgenda.OUTRO,
    descricao: String(formData.get("descricao") || "").trim(),
    cor: String(formData.get("cor") || "").trim() || "#fecaca",
    recorrente: String(formData.get("recorrente") || "") === "1",
  };

  const parsed = bloqueioSchema.safeParse(fields);
  return { fields, parsed };
}

export function getFirstBloqueioError(
  errors: Partial<Record<BloqueioFieldName, string[] | undefined>>
) {
  for (const field of bloqueioFieldNames) {
    const first = errors[field]?.[0];
    if (first) return first;
  }
  return "Verifique os dados do bloqueio.";
}