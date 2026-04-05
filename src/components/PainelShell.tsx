"use client";

import { useState, type ReactNode } from "react";
import PainelSidebar from "@/components/layout/PainelSidebar";
import PainelTopbar from "@/components/layout/PainelTopbar";
import ThemeToggle from "@/components/theme/ThemeToggle";

type PainelShellProps = {
  companyName: string;
  children: ReactNode;
  userPapelBase?: string;
};

export default function PainelShell({ companyName, children, userPapelBase }: PainelShellProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <PainelSidebar
        companyName={companyName}
        open={open}
        onClose={() => setOpen(false)}
      />

      <div className="lg:pl-72 flex flex-col min-h-screen">
        <PainelTopbar
          companyName={companyName}
          onOpenMenu={() => setOpen(true)}
          themeToggle={<ThemeToggle />}
          userPapelBase={userPapelBase}
        />

        <main className="flex-1 p-4 md:p-6 bg-[var(--bg)]">
          {children}
        </main>
      </div>
    </div>
  );
}