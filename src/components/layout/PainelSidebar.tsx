"use client";

import Link from "next/link";
import { LogOut, Scissors } from "lucide-react";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  UserCog,
  Building2,
  Briefcase,
  Package,
  CalendarDays,
  Receipt,
  Landmark,
  FileBarChart2,
  Shield,
  Globe,
  DatabaseBackup,
  ScrollText,
  X,
  ChevronRight,
  BadgeDollarSign,
  Boxes,
  ShoppingCart,
} from "lucide-react";
import clsx from "clsx";

type PainelSidebarProps = {
  companyName: string;
  open: boolean;
  onClose: () => void;
};

type SidebarItem = {
  href: string;
  label: string;
  icon: any;
  color?: string;
  children?: {
    href: string;
    label: string;
    icon?: any;
  }[];
};

type SidebarGroup = {
  label: string;
  items: SidebarItem[];
};

const groups: SidebarGroup[] = [
  {
    label: "Operacional",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, color: "#a78bfa" },
      { href: "/agenda", label: "Agenda", icon: CalendarDays, color: "#34d399" },
      { href: "/comandas", label: "Comandas", icon: Receipt, color: "#60a5fa" },
      { href: "/pdv", label: "PDV", icon: ShoppingCart, color: "#10b981" },
      { href: "/financeiro", label: "Financeiro", icon: Landmark, color: "#fbbf24" },
    ],
  },
  {
    label: "Cadastros",
    items: [
      { href: "/clientes", label: "Clientes", icon: Users, color: "#f472b6" },
      { href: "/profissionais", label: "Profissionais", icon: Scissors, color: "#c084fc" },
      { href: "/funcionarios", label: "Funcionários", icon: Briefcase, color: "#94a3b8" },
      { href: "/servicos", label: "Serviços", icon: UserCog, color: "#f97316" },
      { href: "/produtos", label: "Produtos", icon: Package, color: "#2dd4bf" },
      { href: "/estoque", label: "Estoque", icon: Boxes, color: "#fb7185" },
    ],
  },
  {
    label: "Gestão",
    items: [
      {
        href: "/relatorios",
        label: "Relatórios",
        icon: FileBarChart2,
        color: "#818cf8",
        children: [
          { href: "/relatorios/clientes", label: "Clientes", icon: Users },
          { href: "/relatorios/profissionais", label: "Comissões", icon: BadgeDollarSign },
          { href: "/relatorios/profissionais-servicos", label: "Serviços (Profissionais)", icon: Scissors },
          { href: "/relatorios/vendas", label: "Vendas", icon: BadgeDollarSign },
          { href: "/relatorios/estoque", label: "Estoque", icon: Package },
          { href: "/relatorios/financeiro", label: "Financeiro", icon: Landmark },
        ],
      },
    ],
  },
  {
    label: "Configurações",
    items: [
      { href: "/empresa", label: "Empresa", icon: Building2, color: "#64748b" },
      { href: "/site", label: "Site", icon: Globe, color: "#22d3ee" },
      { href: "/usuarios", label: "Usuários", icon: Shield, color: "#a3e635" },
      { href: "/auditoria", label: "Auditoria", icon: ScrollText, color: "#94a3b8" },
      { href: "/backup", label: "Backup/Restaurar", icon: DatabaseBackup, color: "#fb923c" },
    ],
  },
];

export default function PainelSidebar({ companyName, open, onClose }: PainelSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Overlay mobile */}
      <div
        className={clsx(
          "fixed inset-0 z-40 backdrop-blur-sm transition-all duration-300 lg:hidden",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        style={{ background: "rgba(10,8,18,0.7)" }}
        onClick={onClose}
      />

      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-50 w-72 flex flex-col transition-transform duration-300 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
        style={{
          background: "linear-gradient(180deg, #0d0820 0%, #0a0615 50%, #0d0820 100%)",
          borderRight: "1px solid rgba(124,58,237,0.2)",
        }}
      >
        {/* Header */}
        <div
          className="flex h-16 shrink-0 items-center justify-between px-4"
          style={{ borderBottom: "1px solid rgba(124,58,237,0.15)" }}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
              style={{ background: "linear-gradient(135deg, #7c3aed, #d946ef)" }}
            >
              <Scissors className="h-4 w-4 text-white" />
            </div>
            <div className="min-w-0">
              <p
                className="text-[10px] font-semibold uppercase tracking-[0.2em]"
                style={{ color: "rgba(217,70,239,0.7)" }}
              >
                Painel
              </p>
              <p className="truncate text-sm font-bold" style={{ color: "#ffffff" }}>
                {companyName}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 transition lg:hidden"
            style={{ color: "#8b7fb5" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(124,58,237,0.15)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            aria-label="Fechar menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex flex-1 flex-col overflow-y-auto p-3 gap-4 py-4">
          {groups.map((group) => (
            <div key={group.label}>
              <p
                className="mb-1.5 px-2 text-[10px] font-bold uppercase tracking-[0.25em]"
                style={{ color: "rgba(139,127,181,0.6)" }}
              >
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const hasChildren = Array.isArray(item.children) && item.children.length > 0;
                  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  const open_sub = hasChildren && pathname.startsWith(item.href);

                  return (
                    <div key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onClose}
                        className="flex items-center justify-between gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200"
                        style={
                          active
                            ? {
                                background: "linear-gradient(135deg, rgba(124,58,237,0.25), rgba(217,70,239,0.15))",
                                color: "#e9d5ff",
                                boxShadow: "inset 0 0 0 1px rgba(124,58,237,0.3)",
                              }
                            : { color: "#8b7fb5" }
                        }
                        onMouseEnter={(e) => {
                          if (!active) {
                            e.currentTarget.style.background = "rgba(124,58,237,0.1)";
                            e.currentTarget.style.color = "#c4b5fd";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!active) {
                            e.currentTarget.style.background = "transparent";
                            e.currentTarget.style.color = "#8b7fb5";
                          }
                        }}
                      >
                        <span className="flex min-w-0 items-center gap-2.5">
                          <span
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                            style={{
                              background: active
                                ? "rgba(124,58,237,0.3)"
                                : "rgba(255,255,255,0.04)",
                            }}
                          >
                            <Icon
                              className="h-4 w-4"
                              style={{ color: active ? "#e9d5ff" : item.color || "#8b7fb5" }}
                            />
                          </span>
                          <span className="truncate">{item.label}</span>
                        </span>

                        {hasChildren && (
                          <ChevronRight
                            className="h-3.5 w-3.5 shrink-0 transition-transform duration-200"
                            style={{
                              color: "#6b6584",
                              transform: open_sub ? "rotate(90deg)" : "rotate(0deg)",
                            }}
                          />
                        )}
                      </Link>

                      {hasChildren && open_sub && (
                        <div className="ml-4 mt-0.5 space-y-0.5 border-l pl-3"
                          style={{ borderColor: "rgba(124,58,237,0.2)" }}
                        >
                          {item.children!.map((child) => {
                            const ChildIcon = child.icon;
                            const childActive =
                              pathname === child.href || pathname.startsWith(`${child.href}/`);

                            return (
                              <Link
                                key={child.href}
                                href={child.href}
                                onClick={onClose}
                                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all duration-200"
                                style={
                                  childActive
                                    ? { color: "#c4b5fd", fontWeight: 600 }
                                    : { color: "#6b6584" }
                                }
                                onMouseEnter={(e) => {
                                  if (!childActive) e.currentTarget.style.color = "#a78bfa";
                                }}
                                onMouseLeave={(e) => {
                                  if (!childActive) e.currentTarget.style.color = "#6b6584";
                                }}
                              >
                                {ChildIcon ? (
                                  <ChildIcon className="h-3.5 w-3.5 shrink-0" />
                                ) : (
                                  <span
                                    className="h-1.5 w-1.5 rounded-full shrink-0"
                                    style={{ background: childActive ? "#c4b5fd" : "#4a4468" }}
                                  />
                                )}
                                <span className="truncate">{child.label}</span>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Footer */}
          <div className="mt-auto pt-2" style={{ borderTop: "1px solid rgba(124,58,237,0.15)" }}>
            <Link
              href="/logout"
              onClick={onClose}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200"
              style={{ color: "#f87171" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(239,68,68,0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              <span
                className="flex h-7 w-7 items-center justify-center rounded-lg"
                style={{ background: "rgba(239,68,68,0.08)" }}
              >
                <LogOut className="h-4 w-4" />
              </span>
              <span className="truncate">Sair do sistema</span>
            </Link>
          </div>
        </nav>
      </aside>
    </>
  );
}