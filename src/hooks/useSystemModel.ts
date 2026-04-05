"use client";

import { useEffect, useState } from "react";
import {
  applySystemModelToDocument,
  DEFAULT_SYSTEM_MODELS,
  SYSTEM_MODEL_EVENT,
  SYSTEM_MODEL_STORAGE_KEY,
  type SystemModelPayload,
} from "@/lib/system-models";

type SwitchPayload = {
  modelId: string;
  scope?: "user" | "company";
  confirm?: boolean;
};

type UseSystemModelReturn = {
  currentModel: SystemModelPayload | null;
  models: SystemModelPayload[];
  isLoading: boolean;
  error: string | null;
  switchModel: (payload: SwitchPayload) => Promise<void>;
  refresh: () => Promise<void>;
};

export function useSystemModel(): UseSystemModelReturn {
  const isFeatureEnabled = process.env.NEXT_PUBLIC_ENABLE_MODEL_SWITCH !== "false";
  const [currentModel, setCurrentModel] = useState<SystemModelPayload | null>(null);
  const [models, setModels] = useState<SystemModelPayload[]>(DEFAULT_SYSTEM_MODELS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    if (!isFeatureEnabled) {
      const fallback = DEFAULT_SYSTEM_MODELS.find((model) => model.id === "barbearia_v1") || DEFAULT_SYSTEM_MODELS[0];
      setCurrentModel(fallback);
      setModels(DEFAULT_SYSTEM_MODELS);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [modelsResponse, currentResponse] = await Promise.all([
        fetch("/api/system-models", { cache: "no-store" }),
        fetch("/api/system-model", { cache: "no-store" }),
      ]);

      if (!modelsResponse.ok || !currentResponse.ok) {
        throw new Error("Falha ao carregar configuração de modelos");
      }

      const [modelsData, currentData] = await Promise.all([modelsResponse.json(), currentResponse.json()]);
      setModels(modelsData.models || DEFAULT_SYSTEM_MODELS);
      setCurrentModel(currentData.currentModel || null);

      if (currentData.currentModelId) {
        localStorage.setItem(SYSTEM_MODEL_STORAGE_KEY, currentData.currentModelId);
        applySystemModelToDocument(currentData.currentModelId);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao carregar modelos";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  async function switchModel({ modelId, scope = "user", confirm = false }: SwitchPayload) {
    if (!isFeatureEnabled) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/system-model", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modelId, scope, confirm }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Falha ao trocar modelo");
      }

      localStorage.setItem(SYSTEM_MODEL_STORAGE_KEY, modelId);
      applySystemModelToDocument(modelId);
      setCurrentModel(data.currentModel || models.find((item) => item.id === modelId) || null);

      window.dispatchEvent(new CustomEvent(SYSTEM_MODEL_EVENT, { detail: data }));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const stored = localStorage.getItem(SYSTEM_MODEL_STORAGE_KEY);
    if (stored) {
      applySystemModelToDocument(stored);
      setCurrentModel(DEFAULT_SYSTEM_MODELS.find((model) => model.id === stored) || null);
    } else {
      applySystemModelToDocument("barbearia_v1");
    }

    void refresh();

    const handleChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ newModelId?: string; currentModel?: SystemModelPayload }>;
      if (customEvent.detail?.newModelId) {
        applySystemModelToDocument(customEvent.detail.newModelId);
      }
      if (customEvent.detail?.currentModel) {
        setCurrentModel(customEvent.detail.currentModel);
      }
    };

    window.addEventListener(SYSTEM_MODEL_EVENT, handleChange);
    return () => window.removeEventListener(SYSTEM_MODEL_EVENT, handleChange);
  }, []);

  return { currentModel, models, isLoading, error, switchModel, refresh };
}

export default useSystemModel;
