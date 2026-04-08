import Link from "next/link";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import PageHeader from "@/components/layout/PageHeader";
import ProfissionalTable from "@/components/profissionais/ProfissionalTable";

type PageProps = {
  searchParams?: Promise<{
    q?: string;
    ok?: string;
  }>;
};

export default async function ProfissionaisPage({ searchParams }: PageProps) {
  const user = await requireUser();
  const params = (await searchParams) || {};

  const q = String(params.q || "").trim();
  const qDigits = q.replace(/\D/g, "");
  const ok = String(params.ok || "").trim();

  const where: Prisma.ProfissionalWhereInput = {
    empresaId: user.empresaId,
  };

  if (q) {
    const qNormalized = q
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    where.OR = [
      { nome: { contains: qNormalized } },
      { email: { contains: qNormalized } },
      { cidade: { contains: qNormalized } },
      ...(qDigits
        ? [
          { cpf: { contains: qDigits } },
          { cnpj: { contains: qDigits } },
          { telefone: { contains: qDigits } },
          { whatsapp: { contains: qDigits } },
        ]
        : []),
    ];
  }

  const profissionais = await prisma.profissional.findMany({
    where,
    select: {
      id: true,
      nome: true,
      cpf: true,
      cnpj: true,
      telefone: true,
      whatsapp: true,
      email: true,
      corAgenda: true,
      ativo: true,
      fotoUrl: true,
    },
    orderBy: { nome: "asc" },
  });

  return (
    <div>
      <PageHeader
        title="Profissionais"
        description="Cadastro, horários, cor da agenda e serviços habilitados."
        actions={
          <Link
            href="/profissionais/novo"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            Novo profissional
          </Link>
        }
      />

      {ok === "created" ? (
        <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Profissional cadastrado com sucesso.
        </div>
      ) : null}

      {ok === "updated" ? (
        <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Profissional atualizado com sucesso.
        </div>
      ) : null}

      <form
        method="get"
        className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Buscar por nome, CPF, CNPJ, telefone, e-mail ou cidade"
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-900"
          />

          <button
            type="submit"
            className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Buscar
          </button>

          <Link
            href="/profissionais"
            className="inline-flex items-center justify-center rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Limpar
          </Link>
        </div>
      </form>

      <ProfissionalTable items={profissionais} />
    </div>
  );
}
