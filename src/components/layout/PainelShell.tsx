"use client";

import { useState, type ReactNode } from "react";
import PainelSidebar from "@/components/layout/PainelSidebar";
import PainelTopbar from "@/components/layout/PainelTopbar";

type Props = {
  children: ReactNode;
  companyName: string;
  userName: string;
};

export default function PainelShell({
  children,
  companyName,
  userName,
}: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <PainelSidebar
        companyName={companyName}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="lg:pl-72">
        <PainelTopbar
          companyName={companyName}
          onOpenMenu={() => setSidebarOpen(true)}
        />

        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}