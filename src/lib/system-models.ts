export const SYSTEM_MODEL_STORAGE_KEY = "system_model_preference";
export const SYSTEM_MODEL_EVENT = "system-model-changed";

export type SystemModelSettings = {
  greeting: string;
  priceTemplate: string;
  responseTone: "formal" | "informal";
  colorScheme?: string;
  serviceLabel?: string;
  appointmentLabel?: string;
  heroVariant?: string;
};

export type SystemModelPayload = {
  id: string;
  name: string;
  description: string;
  icon: string;
  isDefault?: boolean;
  settings: SystemModelSettings;
};

export const DEFAULT_SYSTEM_MODELS: SystemModelPayload[] = [
  {
    id: "padrao_v1",
    name: "Padrão",
    description: "Modelo original do sistema",
    icon: "sparkles",
    isDefault: false,
    settings: {
      greeting: "Bem-vindo ao sistema!",
      priceTemplate: "R$ {value}",
      responseTone: "formal",
      colorScheme: "default",
      serviceLabel: "serviço",
      appointmentLabel: "agendamento",
      heroVariant: "default",
    },
  },
  {
    id: "barbearia_v1",
    name: "Barbearia",
    description: "Tema e linguagem de barbearia",
    icon: "scissors",
    isDefault: true,
    settings: {
      greeting: "Bem-vindo à barbearia!",
      priceTemplate: "R$ {value}",
      responseTone: "informal",
      colorScheme: "barbearia",
      serviceLabel: "corte",
      appointmentLabel: "horário",
      heroVariant: "barber-dark",
    },
  },
  {
    id: "personalizado_v1",
    name: "Personalizado",
    description: "Modelo customizável pelo administrador",
    icon: "sliders",
    isDefault: false,
    settings: {
      greeting: "Olá!",
      priceTemplate: "R$ {value}",
      responseTone: "formal",
      colorScheme: "custom",
      serviceLabel: "serviço",
      appointmentLabel: "agendamento",
      heroVariant: "custom",
    },
  },
];

type DbSystemModel = {
  id: string;
  nome: string;
  descricao: string;
  icone: string | null;
  padrao: boolean;
  configuracoes: unknown;
};

export function normalizeSystemModel(record: DbSystemModel): SystemModelPayload {
  const fallback = DEFAULT_SYSTEM_MODELS.find((model) => model.id === record.id) ?? DEFAULT_SYSTEM_MODELS[0];
  const rawSettings = typeof record.configuracoes === "object" && record.configuracoes !== null
    ? (record.configuracoes as Partial<SystemModelSettings>)
    : {};

  return {
    id: record.id,
    name: record.nome,
    description: record.descricao,
    icon: record.icone || fallback.icon,
    isDefault: record.padrao,
    settings: {
      ...fallback.settings,
      ...rawSettings,
    },
  };
}

export function applySystemModelToDocument(modelId: string) {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.setAttribute("data-model", modelId);
  document.body.classList.remove("model-barbearia", "model-padrao", "model-personalizado");

  if (modelId === "barbearia_v1") {
    document.body.classList.add("model-barbearia");
  } else if (modelId === "personalizado_v1") {
    document.body.classList.add("model-personalizado");
  } else {
    document.body.classList.add("model-padrao");
  }
}

export function getModelCopy(model: SystemModelPayload | null) {
  return {
    greeting: model?.settings.greeting || "Bem-vindo ao sistema!",
    serviceLabel: model?.settings.serviceLabel || "serviço",
    appointmentLabel: model?.settings.appointmentLabel || "agendamento",
  };
}
