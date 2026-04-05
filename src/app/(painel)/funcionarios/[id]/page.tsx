import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import PageHeader from "@/components/layout/PageHeader";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatCpf(value?: string | null) {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.length !== 11) return value || "—";
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

function formatPhone(value?: string | null) {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return "—";
  if (digits.length === 11) {
    return digits.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  }
  if (digits.length === 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  }
  return value || "—";
}

function formatDate(value?: Date | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR").format(value);
}

function getInitials(name?: string | null) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) return "F";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export default async function FuncionarioDetalhePage({ params }: PageProps) {
  const user = await requireUser();
  const { id } = await params;

  const funcionario = await prisma.funcionario.findFirst({
    where: {
      id,
      empresaId: user.empresaId,
    },
  });

  if (!funcionario) notFound();

  return (
    <div>
      <PageHeader
        title={funcionario.nome}
        description="Visualização do cadastro do funcionário."
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/funcionarios"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Voltar
            </Link>

            <Link
              href={`/funcionarios/${funcionario.id}/editar`}
              className="inline-flex items-center justify-center rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Editar
            </Link>
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[220px_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex justify-center">
            <div className="flex h-40 w-40 items-center justify-center overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 shadow-sm">
              {funcionario.fotoUrl ? (
                <img
                  src={funcionario.fotoUrl}
                  alt={funcionario.nome}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-4xl font-semibold text-slate-500">
                  {getInitials(funcionario.nome)}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Dados principais</h2>

          <div className="mt-4 space-y-3 text-sm">
            <div>
              <span className="font-semibold text-slate-900">Nome:</span>{" "}
              <span className="text-slate-700">{funcionario.nome}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-900">CPF:</span>{" "}
              <span className="text-slate-700">{formatCpf(funcionario.cpf)}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-900">Telefone:</span>{" "}
              <span className="text-slate-700">{formatPhone(funcionario.telefone)}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-900">WhatsApp:</span>{" "}
              <span className="text-slate-700">{formatPhone(funcionario.whatsapp)}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-900">E-mail:</span>{" "}
              <span className="text-slate-700">{funcionario.email || "—"}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-900">Data de admissão:</span>{" "}
              <span className="text-slate-700">{formatDate(funcionario.dataAdmissao)}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-900">Data de demissão:</span>{" "}
              <span className="text-slate-700">{formatDate(funcionario.dataDemissao)}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-900">Status:</span>{" "}
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                  funcionario.ativo
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-200 text-slate-700"
                }`}
              >
                {funcionario.ativo ? "Ativo" : "Inativo"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Endereço</h2>

          <div className="mt-4 space-y-3 text-sm">
            <div>
              <span className="font-semibold text-slate-900">CEP:</span>{" "}
              <span className="text-slate-700">{funcionario.cep || "—"}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-900">Logradouro:</span>{" "}
              <span className="text-slate-700">{funcionario.logradouro || "—"}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-900">Número:</span>{" "}
              <span className="text-slate-700">{funcionario.numero || "—"}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-900">Complemento:</span>{" "}
              <span className="text-slate-700">{funcionario.complemento || "—"}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-900">Bairro:</span>{" "}
              <span className="text-slate-700">{funcionario.bairro || "—"}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-900">Cidade/UF:</span>{" "}
              <span className="text-slate-700">
                {funcionario.cidade || "—"}
                {funcionario.uf ? ` / ${funcionario.uf}` : ""}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Observações</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">
            {funcionario.observacoes || "Nenhuma observação cadastrada."}
          </p>
        </div>
      </div>
    </div>
  );
}