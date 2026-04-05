"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

type AgendaAutoRefreshProps = {
  intervalMs?: number;
};

export default function AgendaAutoRefresh({
  intervalMs = 10000,
}: AgendaAutoRefreshProps) {
  const router = useRouter();

  useEffect(() => {
    let busy = false;

    const refreshNow = async () => {
      if (busy) return;
      if (document.visibilityState !== "visible") return;

      busy = true;
      try {
        router.refresh();
      } finally {
        setTimeout(() => {
          busy = false;
        }, 800);
      }
    };

    const interval = window.setInterval(refreshNow, intervalMs);

    const onFocus = () => refreshNow();
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        refreshNow();
      }
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [router, intervalMs]);

  return null;
}