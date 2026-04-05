"use client";

import { Check, Scissors, Sliders, Sparkles, X } from "lucide-react";
import type { SystemModelPayload } from "@/lib/system-models";

type Scope = "user" | "company";

type Props = {
  open: boolean;
  models: SystemModelPayload[];
  currentModelId: string | null;
  scope: Scope;
  isSubmitting: boolean;
  error: string | null;
  onClose: () => void;
  onChangeScope: (scope: Scope) => void;
  onSelectModel: (modelId: string) => void;
};

const iconMap = {
  sparkles: Sparkles,
  scissors: Scissors,
  sliders: Sliders,
};

export default function ModelSelectorModal({
  open,
  models,
  currentModelId,
  scope,
  isSubmitting,
  error,
  onClose,
  onChangeScope,
  onSelectModel,
}: Props) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" role="presentation">
      <div
        className="w-full max-w-2xl rounded-[1.75rem] border border-[var(--line)] bg-[var(--card)] p-6 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="system-model-title"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--muted)]">Modelo</p>
            <h2 id="system-model-title" className="mt-2 text-2xl font-bold text-[var(--text)]">
              Trocar modelo do sistema
            </h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              A seleção atualiza o visual, a linguagem e os templates usados pelo sistema.
            </p>
          </div>

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--line)] text-[var(--muted)] transition hover:bg-[var(--bg-2)]"
            onClick={onClose}
            aria-label="Fechar painel de modelos"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-6 flex gap-2 rounded-2xl bg-[var(--bg-2)] p-1">
          <button
            type="button"
            className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition ${scope === "user" ? "bg-[var(--card)] text-[var(--text)] shadow-sm" : "text-[var(--muted)]"}`}
            onClick={() => onChangeScope("user")}
            aria-pressed={scope === "user"}
          >
            Meu perfil
          </button>
          <button
            type="button"
            className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition ${scope === "company" ? "bg-[var(--card)] text-[var(--text)] shadow-sm" : "text-[var(--muted)]"}`}
            onClick={() => onChangeScope("company")}
            aria-pressed={scope === "company"}
          >
            Toda a empresa
          </button>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {models.map((model) => {
            const Icon = iconMap[model.icon as keyof typeof iconMap] || Sparkles;
            const active = model.id === currentModelId;

            return (
              <button
                key={model.id}
                type="button"
                onClick={() => onSelectModel(model.id)}
                disabled={isSubmitting}
                aria-label={`Selecionar modelo ${model.name}`}
                className={`rounded-[1.5rem] border p-4 text-left transition ${active ? "border-[var(--brand-color)] bg-[var(--brand-gradient-subtle)]" : "border-[var(--line)] bg-[var(--card)] hover:border-[var(--line-2)] hover:bg-[var(--bg-2)]"}`}
                aria-pressed={active}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--brand-gradient)] text-white">
                    <Icon className="h-4 w-4" />
                  </div>
                  {active ? <Check className="h-4 w-4 text-[var(--success)]" aria-hidden="true" /> : null}
                </div>

                <h3 className="mt-4 text-base font-semibold text-[var(--text)]">{model.name}</h3>
                <p className="mt-2 text-sm text-[var(--muted)]">{model.description}</p>
                <p className="mt-4 text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                  Tom: {model.settings.responseTone}
                </p>
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex items-center justify-between gap-4 border-t border-[var(--line)] pt-4">
          <p className="text-xs text-[var(--muted)]">
            {scope === "company"
              ? "A troca será aplicada para todos os usuários da empresa."
              : "A troca será aplicada apenas ao seu perfil."}
          </p>

          {error ? (
            <p className="text-sm text-[var(--danger)]" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
