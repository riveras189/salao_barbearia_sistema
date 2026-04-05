// src/components/layout/ModelSelector.tsx
"use client";

import { useState, useEffect } from "react";
import { Scissors, Sparkles, Sliders, Loader2, Check, X, ChevronDown } from "lucide-react";

type ModelToggleState = "idle" | "loading" | "success" | "error";

const models = [
  { id: "padrao_v1", name: "Padrão", icon: Sparkles, description: "Modelo original" },
  { id: "barbearia_v1", name: "Barbearia", icon: Scissors, description: "Tema barbearia" },
  { id: "personalizado_v1", name: "Personalizado", icon: Sliders, description: "Modelo custom" },
];

const STORAGE_KEY = "system_model_preference";

export default function ModelSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentModel, setCurrentModel] = useState<string>("padrao_v1");
  const [isLoaded, setIsLoaded] = useState(false);
  const [state, setState] = useState<ModelToggleState>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Load from localStorage only on client
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && models.find(m => m.id === stored)) {
      setCurrentModel(stored);
    }
    setIsLoaded(true);
  }, []);

  const currentModelData = models.find(m => m.id === currentModel) || models[0];
  const CurrentIcon = currentModelData.icon;

  // Show loading state until client-side hydration completes
  if (!isLoaded) {
    return (
      <button
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium"
        style={{
          background: "linear-gradient(135deg, #d4a54c, #b8860b)",
          color: "#1a1a1a",
        }}
        disabled
      >
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      </button>
    );
  }

  const handleSelect = async (modelId: string) => {
    if (modelId === currentModel) {
      setIsOpen(false);
      return;
    }

    setState("loading");
    setErrorMessage("");

    try {
      const res = await fetch("/api/system-model", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modelId }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Falha ao trocar modelo (${res.status})`);
      }

      setCurrentModel(modelId);
      localStorage.setItem(STORAGE_KEY, modelId);
      setState("success");
      
      setTimeout(() => {
        setState("idle");
        setIsOpen(false);
      }, 1000);
    } catch (error) {
      setState("error");
      setErrorMessage(error instanceof Error ? error.message : "Erro ao trocar");
      setTimeout(() => setState("idle"), 2000);
    }
  };

  const getStateIcon = () => {
    if (state === "loading") return <Loader2 className="w-4 h-4 animate-spin" />;
    if (state === "success") return <Check className="w-4 h-4 text-green-500" />;
    if (state === "error") return <X className="w-4 h-4 text-red-500" />;
    return null;
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={state === "loading"}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all text-xs font-medium"
        style={{
          background: "linear-gradient(135deg, #d4a54c, #b8860b)",
          color: "#1a1a1a",
        }}
        aria-label={`Modelo: ${currentModelData.name}`}
        aria-expanded={isOpen}
      >
        {state === "loading" ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <CurrentIcon className="w-3.5 h-3.5" />
        )}
        <span className="hidden sm:inline">{currentModelData.name}</span>
        {getStateIcon()}
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 top-full mt-2 w-56 rounded-lg shadow-xl z-50"
          style={{
            background: "var(--card)",
            border: "1px solid var(--line)",
          }}
        >
          <div className="p-2">
            {models.map((model) => {
              const IconComponent = model.icon;
              const isSelected = model.id === currentModel;
              
              return (
                <button
                  key={model.id}
                  onClick={() => handleSelect(model.id)}
                  disabled={state === "loading"}
                  className={`w-full flex items-center gap-3 p-2 rounded-lg transition-all text-left ${
                    isSelected 
                      ? "bg-amber-500/20 border border-amber-500" 
                      : "hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  <div className={`p-1.5 rounded ${isSelected ? "bg-amber-500" : "bg-gray-200 dark:bg-gray-700"}`}>
                    <IconComponent className={`w-3.5 h-3.5 ${isSelected ? "text-black" : "text-gray-600 dark:text-gray-300"}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium" style={{ color: "var(--text)" }}>{model.name}</p>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>{model.description}</p>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-amber-500" />}
                </button>
              );
            })}
          </div>
          
          <div className="p-2 border-t" style={{ borderColor: "var(--line)" }}>
            <p className="text-xs text-center" style={{ color: "var(--muted)" }}>
              Apenas admins podem alterar
            </p>
          </div>
        </div>
      )}
    </div>
  );
}