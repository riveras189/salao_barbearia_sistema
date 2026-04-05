"use client";

import { useRouter } from "next/navigation";

type Props = {
  fallbackHref?: string;
  label?: string;
};

export default function PanelBackButton({
  fallbackHref = "/home",
  label = "Voltar",
}: Props) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        if (typeof window !== "undefined" && window.history.length > 1) {
          router.back();
          return;
        }
        router.push(fallbackHref);
      }}
      className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-900 bg-slate-900 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
    >
      ← {label}
    </button>
  );
}