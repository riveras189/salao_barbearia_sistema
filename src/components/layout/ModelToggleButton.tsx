"use client";

import { useMemo, useState } from "react";
import { Check, ChevronDown, Loader2, Scissors, Sliders, Sparkles, X } from "lucide-react";
import useSystemModel from "@/hooks/useSystemModel";
import { trackAnalyticsEvent } from "@/lib/analytics";
import ModelSelectorModal from "./ModelSelectorModal";

type ToggleState = "idle" | "loading" | "success" | "error";
type Scope = "user" | "company";

const iconMap = {
  sparkles: Sparkles,
  scissors: Scissors,
  sliders: Sliders,
};

export default function ModelToggleButton() {
  const { currentModel, models, isLoading, error, switchModel } = useSystemModel();
  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState<Scope>("user");
  const [state, setState] = useState<ToggleState>("idle");
  const [localError, setLocalError] = useState<string | null>(null);

  const CurrentIcon = useMemo(() => {
    const icon = currentModel?.icon as keyof typeof iconMap | undefined;
    return icon ? iconMap[icon] : Sparkles;
  }, [currentModel?.icon]);

  async function handleSelectModel(modelId: string) {
    if (modelId === currentModel?.id) {
      setOpen(false);
      return;
    }

    if (scope === "company") {
      const confirmed = window.confirm("Aplicar este modelo para toda a empresa?");
      if (!confirmed) {
        return;
      }
    }

    setState("loading");
    setLocalError(null);

    try {
      const previousModelId = currentModel?.id ?? null;
      await switchModel({ modelId, scope, confirm: scope === "company" });

      trackAnalyticsEvent("system_model_switched", {
        previousModelId,
        newModelId: modelId,
        scope,
      });

      setState("success");
      window.setTimeout(() => {
        setState("idle");
        setOpen(false);
      }, 900);
    } catch (err) {
      setState("error");
      setLocalError(err instanceof Error ? err.message : "Erro ao trocar modelo");
      window.setTimeout(() => setState("idle"), 1800);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={isLoading || state === "loading"}
        className="inline-flex h-11 items-center gap-2 rounded-2xl border border-[var(--line)] bg-[var(--card)] px-4 text-sm font-semibold text-[var(--text)] shadow-sm transition hover:border-[var(--line-2)] hover:bg-[var(--bg-2)]"
        aria-label={`Modelo ativo: ${currentModel?.name ?? "Barbearia"}`}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        {state === "loading" || isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CurrentIcon className="h-4 w-4" />}
        <span>Modelo</span>
        <span className="hidden sm:inline">{currentModel?.name ?? "Barbearia"}</span>
        {state === "success" ? <Check className="h-4 w-4 text-[var(--success)]" /> : null}
        {state === "error" ? <X className="h-4 w-4 text-[var(--danger)]" /> : null}
        <ChevronDown className="h-4 w-4" />
      </button>

      <ModelSelectorModal
        open={open}
        models={models}
        currentModelId={currentModel?.id ?? null}
        scope={scope}
        isSubmitting={state === "loading" || isLoading}
        error={localError || error}
        onClose={() => setOpen(false)}
        onChangeScope={setScope}
        onSelectModel={handleSelectModel}
      />
    </>
  );
}
