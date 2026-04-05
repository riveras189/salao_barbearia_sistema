import Link from "next/link";
import {
  Users,
  Scissors,
  BadgeDollarSign,
  Package,
  Landmark,
  FileBarChart2,
  ShoppingCart,
} from "lucide-react";

const items = [
  {
    href: "/relatorios/clientes",
    title: "Clientes",
    description: "Cadastros, frequência e gastos",
    icon: Users,
  },
  {
    href: "/relatorios/profissionais",
    title: "Profissionais",
    description: "Comissões e serviços realizados",
    icon: Scissors,
  },
  {
    href: "/relatorios/pdv",
    title: "PDV",
    description: "Vendas rápidas e pagamentos",
    icon: ShoppingCart,
  },
  {
    href: "/relatorios/vendas",
    title: "Vendas",
    description: "Vendas por período, por serviço e por profissional",
    icon: BadgeDollarSign,
  },
  {
    href: "/relatorios/estoque",
    title: "Estoque",
    description: "Entradas, saídas e produtos críticos",
    icon: Package,
  },
  {
    href: "/relatorios/financeiro",
    title: "Financeiro",
    description: "Receita, despesas e lucro",
    icon: Landmark,
  },
];

export default function RelatoriosPage() {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-slate-900 p-3 text-white">
            <FileBarChart2 className="h-6 w-6" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-slate-900">Relatórios</h1>
            <p className="mt-1 text-sm text-slate-600">
              Escolha o tipo de relatório que deseja visualizar no sistema.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
            >
              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-slate-100 p-3 text-slate-700 transition group-hover:bg-slate-900 group-hover:text-white">
                  <Icon className="h-6 w-6" />
                </div>

                <div className="min-w-0">
                  <h2 className="text-lg font-semibold text-slate-900">
                    {item.title}
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {item.description}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}