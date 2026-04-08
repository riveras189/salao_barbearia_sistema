import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { saveEmpresaAction } from "@/actions/empresa";
import EmpresaForm from "@/components/empresa/EmpresaForm";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getParam(
  params: Record<string, string | string[] | undefined>,
  key: string
) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

export default async function EmpresaPage({ searchParams }: PageProps) {
  const user = await requireUser();
  const params = await searchParams;

  let empresa =
    user?.empresaId
      ? await prisma.empresa.findUnique({
        where: { id: user.empresaId },
        include: {
          logo: {
            select: {
              url: true,
            },
          },
        },
      })
      : null;

  if (!empresa) {
    empresa = await prisma.empresa.findFirst({
      orderBy: { createdAt: "asc" },
      include: {
        logo: {
          select: {
            url: true,
          },
        },
      },
    });
  }

  const ok = getParam(params, "ok");
  const erro = getParam(params, "erro");

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Cadastro da empresa
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Cadastre os dados principais da empresa para usar no sistema e nos
            relatórios.
          </p>
        </div>

        <Link
          href="/dashboard"
          className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Voltar
        </Link>
      </div>

      {ok ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Dados da empresa salvos com sucesso.
        </div>
      ) : null}

      {erro ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {erro}
        </div>
      ) : null}

      <EmpresaForm
        action={saveEmpresaAction}
        empresa={
          empresa
            ? {
              ...empresa,
              logoUrl: empresa.logo?.url ?? null,
            }
            : null
        }
      />
    </div>
  );
}