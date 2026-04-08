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

export default async function ClienteDetalhePage({ params }: PageProps) {
  const user = await requireUser();
  const { id } = await params;

  const cliente = await prisma.cliente.findFirst({
    where: {
      id,
      empresaId: user.empresaId,
    },
  });

  if (!cliente) notFound();

  return (
    <div>
      <PageHeader
        title={cliente.nome}
        description="Visualização do cadastro do cliente."
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/clientes"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Voltar
            </Link>

            <Link
              href={`/clientes/${cliente.id}/editar`}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              Editar
            </Link>
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Dados principais</h2>

          <div className="mt-4 space-y-3 text-sm">
            <div>
              <span className="font-semibold text-slate-900">Nome:</span>{" "}
              <span className="text-slate-700">{cliente.nome}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-900">CPF:</span>{" "}
              <span className="text-slate-700">{formatCpf(cliente.cpf)}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-900">Telefone:</span>{" "}
              <span className="text-slate-700">{formatPhone(cliente.telefone)}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-900">WhatsApp:</span>{" "}
              <span className="text-slate-700">{formatPhone(cliente.whatsapp)}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-900">E-mail:</span>{" "}
              <span className="text-slate-700">{cliente.email || "—"}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-900">
                Data de nascimento:
              </span>{" "}
              <span className="text-slate-700">
                {formatDate(cliente.dataNascimento)}
              </span>
            </div>
            <div>
              <span className="font-semibold text-slate-900">Status:</span>{" "}
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${cliente.ativo
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-slate-200 text-slate-700"
                  }`}
              >
                {cliente.ativo ? "Ativo" : "Inativo"}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Endereço</h2>

          <div className="mt-4 space-y-3 text-sm">
            <div>
              <span className="font-semibold text-slate-900">CEP:</span>{" "}
              <span className="text-slate-700">{cliente.cep || "—"}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-900">Logradouro:</span>{" "}
              <span className="text-slate-700">{cliente.logradouro || "—"}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-900">Número:</span>{" "}
              <span className="text-slate-700">{cliente.numero || "—"}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-900">Complemento:</span>{" "}
              <span className="text-slate-700">{cliente.complemento || "—"}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-900">Bairro:</span>{" "}
              <span className="text-slate-700">{cliente.bairro || "—"}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-900">Cidade/UF:</span>{" "}
              <span className="text-slate-700">
                {cliente.cidade || "—"}
                {cliente.uf ? ` / ${cliente.uf}` : ""}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Observações</h2>
        <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">
          {cliente.observacoes || "Nenhuma observação cadastrada."}
        </p>
      </div>
    </div>
  );
}