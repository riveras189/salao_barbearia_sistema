// src/components/layout/PainelTopbar.tsx
"use client";

import { type ReactNode } from "react";
import Link from "next/link";
import { Menu, Scissors, Sparkles } from "lucide-react";
import ModelToggleButton from "./ModelToggleButton";
import useSystemModel from "@/hooks/useSystemModel";
import { getModelCopy } from "@/lib/system-models";

type Props = {
  companyName: string;
  onOpenMenu: () => void;
  themeToggle?: ReactNode;
  userPapelBase?: string;
};

export default function PainelTopbar({ companyName, onOpenMenu, themeToggle, userPapelBase }: Props) {
  const isAdmin = userPapelBase === "ADMIN" || userPapelBase === "GERENTE";
  const modelSwitchEnabled = process.env.NEXT_PUBLIC_ENABLE_MODEL_SWITCH !== "false";
  const { currentModel } = useSystemModel();
  const copy = getModelCopy(currentModel);
  const BrandIcon = currentModel?.id === "barbearia_v1" ? Scissors : Sparkles;

  return (
    <header
      className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-3 px-4 md:px-6"
      style={{
        background: "rgba(var(--bg-rgb, 245,243,255), 0.85)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: "1px solid var(--line)",
      }}
    >
      {/* Left */}
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onOpenMenu}
          className="flex h-9 w-9 items-center justify-center rounded-xl border transition-all duration-200 lg:hidden"
          style={{
            borderColor: "var(--line)",
            color: "var(--muted)",
            background: "var(--card)",
          }}
          aria-label="Abrir menu"
        >
          <Menu className="h-4.5 w-4.5" />
        </button>

        <div className="flex items-center gap-2 min-w-0">
          <div
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
            style={{ background: "var(--brand-gradient)" }}
          >
            <BrandIcon className="h-3.5 w-3.5 text-white" />
          </div>
          <div className="min-w-0 hidden sm:block">
            <p
              className="truncate text-sm font-bold leading-tight"
              style={{ color: "var(--text)" }}
            >
              {companyName}
            </p>
            <p className="truncate text-xs" style={{ color: "var(--muted)" }}>
              {copy.greeting} Organize {copy.serviceLabel}s, {copy.appointmentLabel}s e atendimento.
            </p>
          </div>
        </div>
      </div>

      {/* Right */}
        <div className="flex items-center gap-2">
          {/* Model Selector - Only for Admin/Gerente */}
          {isAdmin && modelSwitchEnabled && <ModelToggleButton />}

        <Link
          href="/"
          target="_blank"
          className="hidden sm:inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all duration-200"
          style={{
            border: "1px solid var(--line)",
            color: "var(--muted)",
            background: "var(--card)",
          }}
        >
          Ver site
        </Link>

        {themeToggle}
      </div>
    </header>
  );
}
