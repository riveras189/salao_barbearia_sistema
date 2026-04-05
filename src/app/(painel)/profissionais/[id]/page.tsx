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

function formatCnpj(value?: string | null) {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.length !== 14) return value || "—";
  return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
}

function formatPhone(value?: string | null) {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return "—";
  if (digits.length === 11) return digits.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  if (digits.length === 10) return digits.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  return value || "—";
}

function formatDate(value?: Date | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR").format(value);
}

export default async function ProfissionalDetalhePage({ params }: PageProps) {
  const user = await requireUser();
  const { id } = await params;

  const profissional = await prisma.profissional.findFirst({
    where: {
      id,
      empresaId: user.empresaId,
    },
    include: {
      horarios: {
        orderBy: [{ diaSemana: "asc" }],
      },
      servicos: {
        include: {
          servico: true,
        },
      },
    },
  });

  if (!profissional) notFound();

  return (
    <div>
      <PageHeader
        title={profissional.nome}
        description="Visualização do cadastro do profissional."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/profissionais"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Voltar
            </Link>

            <Link
              href={`/profissionais/${profissional.id}/editar`}
              className="inline-flex items-center justify-center rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Editar
            </Link>

            <Link
              href={`/profissionais/${profissional.id}/horarios`}
              className="inline-flex items-center justify-center rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Horários
            </Link>

            <Link
              href={`/profissionais/${profissional.id}/servicos`}
              className="inline-flex items-center justify-center rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Serviços
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
              <span className="text-slate-700">{profissional.nome}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-900">CPF:</span>{" "}
              <span className="text-slate-700">{formatCpf(profissional.cpf)}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-900">CNPJ:</span>{" "}
              <span className="text-slate-700">{formatCnpj(profissional.cnpj)}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-900">Telefone:</span>{" "}
              <span className="text-slate-700">
                {formatPhone(profissional.telefone)}
              </span>
            </div>
            <div>
              <span className="font-semibold text-slate-900">WhatsApp:</span>{" "}
              <span className="text-slate-700">
                {formatPhone(profissional.whatsapp)}
              </span>
            </div>
            <div>
              <span className="font-semibold text-slate-900">E-mail:</span>{" "}
              <span className="text-slate-700">{profissional.email || "—"}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-900">Admissão:</span>{" "}
              <span className="text-slate-700">
                {formatDate(profissional.dataAdmissao)}
              </span>
            </div>
            <div>
              <span className="font-semibold text-slate-900">Demissão:</span>{" "}
              <span className="text-slate-700">
                {formatDate(profissional.dataDemissao)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900">Cor agenda:</span>
              <span
                className="h-5 w-5 rounded-full border border-slate-300"
                style={{ backgroundColor: profissional.corAgenda || "#1d4ed8" }}
              />
              <span className="text-slate-700">
                {profissional.corAgenda || "#1d4ed8"}
              </span>
            </div>
            <div>
              <span className="font-semibold text-slate-900">Status:</span>{" "}
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                  profissional.ativo
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-200 text-slate-700"
                }`}
              >
                {profissional.ativo ? "Ativo" : "Inativo"}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Endereço</h2>

          <div className="mt-4 space-y-3 text-sm">
            <div>
              <span className="font-semibold text-slate-900">CEP:</span>{" "}
              <span className="text-slate-700">{profissional.cep || "—"}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-900">Logradouro:</span>{" "}
              <span className="text-slate-700">
                {profissional.logradouro || "—"}
              </span>
            </div>
            <div>
              <span className="font-semibold text-slate-900">Número:</span>{" "}
              <span className="text-slate-700">{profissional.numero || "—"}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-900">Complemento:</span>{" "}
              <span className="text-slate-700">
                {profissional.complemento || "—"}
              </span>
            </div>
            <div>
              <span className="font-semibold text-slate-900">Bairro:</span>{" "}
              <span className="text-slate-700">{profissional.bairro || "—"}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-900">Cidade/UF:</span>{" "}
              <span className="text-slate-700">
                {profissional.cidade || "—"}
                {profissional.uf ? ` / ${profissional.uf}` : ""}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Horários</h2>

          {profissional.horarios.length ? (
            <div className="mt-4 space-y-2 text-sm text-slate-700">
              {profissional.horarios.map((horario) => (
                <div
                  key={horario.id}
                  className="rounded-xl border border-slate-200 px-4 py-3"
                >
                  Dia {horario.diaSemana} • {horario.horaInicio} às {horario.horaFim}
                  {horario.intervaloInicio && horario.intervaloFim
                    ? ` • Intervalo ${horario.intervaloInicio} às ${horario.intervaloFim}`
                    : ""}
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500">
              Nenhum horário cadastrado.
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Serviços</h2>

          {profissional.servicos.length ? (
            <div className="mt-4 space-y-2 text-sm text-slate-700">
              {profissional.servicos.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-200 px-4 py-3"
                >
                  {item.servico.nome}
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500">
              Nenhum serviço vinculado.
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Observações</h2>
        <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">
          {profissional.observacoes || "Nenhuma observação cadastrada."}
        </p>
      </div>
    </div>
  );
}