import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import PageHeader from "@/components/layout/PageHeader";
import FuncionarioTable from "@/components/funcionarios/FuncionarioTable";

type PageProps = {
  searchParams?: Promise<{
    q?: string;
    ok?: string;
  }>;
};

function text(value?: string | null) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function digits(value?: string | null) {
  return String(value || "").replace(/\D/g, "");
}

export default async function FuncionariosPage({ searchParams }: PageProps) {
  const user = await requireUser();
  const params = (await searchParams) || {};

  const q = String(params.q || "").trim();
  const ok = String(params.ok || "").trim();

  const funcionarios = await prisma.funcionario.findMany({
    where: {
      empresaId: user.empresaId,
    },
    select: {
      id: true,
      nome: true,
      cpf: true,
      telefone: true,
      whatsapp: true,
      email: true,
      cidade: true,
      uf: true,
      ativo: true,
      fotoUrl: true,
    },
    orderBy: { nome: "asc" },
  });

  const qText = text(q);
  const qDigits = digits(q);

  const filteredItems = q
    ? funcionarios.filter((funcionario) => {
        const nome = text(funcionario.nome);
        const email = text(funcionario.email);
        const cidade = text(funcionario.cidade);
        const uf = text(funcionario.uf);

        const cpf = digits(funcionario.cpf);
        const telefone = digits(funcionario.telefone);
        const whatsapp = digits(funcionario.whatsapp);

        const matchTexto =
          nome.includes(qText) ||
          email.includes(qText) ||
          cidade.includes(qText) ||
          uf.includes(qText);

        const matchNumero =
          qDigits.length > 0 &&
          (cpf.includes(qDigits) ||
            telefone.includes(qDigits) ||
            whatsapp.includes(qDigits));

        return matchTexto || matchNumero;
      })
    : funcionarios;

  return (
    <div>
      <PageHeader
        title="Funcionários"
        description="Cadastro, pesquisa e manutenção de funcionários."
        actions={
          <Link
            href="/funcionarios/novo"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            Novo funcionário
          </Link>
        }
      />

      {ok === "created" ? (
        <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Funcionário cadastrado com sucesso.
        </div>
      ) : null}

      {ok === "updated" ? (
        <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Funcionário atualizado com sucesso.
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
            placeholder="Buscar por nome, CPF, telefone, e-mail ou cidade"
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-900"
          />

          <button
            type="submit"
            className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Buscar
          </button>

          <Link
            href="/funcionarios"
            className="inline-flex items-center justify-center rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Limpar
          </Link>
        </div>
      </form>

      <FuncionarioTable items={filteredItems} />
    </div>
  );
}