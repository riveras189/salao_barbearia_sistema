import { redirect } from "next/navigation";
import { requireClienteUser, clearClienteSession } from "@/lib/auth-cliente";
import { prisma } from "@/lib/prisma";

function formatDateTimeBR(value: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(value);
}

function formatMoney(value: unknown) {
  const n =
    typeof value === "number"
      ? value
      : typeof value === "string"
      ? Number(value)
      : value && typeof value === "object" && "toNumber" in (value as any)
      ? (value as any).toNumber()
      : Number(value ?? 0);

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number.isFinite(n) ? n : 0);
}

function getStatusLabel(status: string) {
  switch (status) {
    case "AGENDADO":
      return "Agendado";
    case "CONFIRMADO":
      return "Confirmado";
    case "EM_ATENDIMENTO":
      return "Em atendimento";
    case "CONCLUIDO":
      return "Concluído";
    case "CANCELADO":
      return "Cancelado";
    case "FALTOU":
      return "Faltou";
    default:
      return status;
  }
}

export default async function ClienteAgendaPage() {
  const cliente = await requireClienteUser();

  async function sairAction() {
    "use server";
    await clearClienteSession();
    redirect("/cliente/login");
  }

  const agendamentos = await prisma.agendamento.findMany({
    where: {
      empresaId: cliente.empresaId,
      clienteId: cliente.clienteId,
    },
    include: {
      profissional: {
        select: { nome: true },
      },
      servicos: {
        select: {
          nomeSnapshot: true,
          duracaoMinSnapshot: true,
          valorSnapshot: true,
        },
        orderBy: {
          ordem: "asc",
        },
      },
    },
    orderBy: {
      inicio: "desc",
    },
  });

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Minha agenda</h1>
              <p className="mt-2 text-sm text-slate-600">
                Olá, {cliente.nome}. Aqui você vê somente os seus agendamentos.
              </p>
            </div>

            <form action={sairAction}>
              <button className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                Sair da área do cliente
              </button>
            </form>
          </div>
        </div>

        <div className="space-y-4">
          {agendamentos.map((item) => (
            <div
              key={item.id}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-lg font-bold text-slate-900">
                    {formatDateTimeBR(item.inicio)}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Profissional: {item.profissional.nome}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Status: {getStatusLabel(item.status)}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">
                  {item.origem}
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {item.servicos.map((servico, index) => (
                  <div
                    key={index}
                    className="rounded-2xl border border-slate-200 px-4 py-3"
                  >
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <p className="font-semibold text-slate-900">
                        {servico.nomeSnapshot}
                      </p>

                      <p className="text-sm font-medium text-slate-700">
                        {formatMoney(servico.valorSnapshot)}
                      </p>
                    </div>

                    <p className="text-sm text-slate-600">
                      {servico.duracaoMinSnapshot} min
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {agendamentos.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
              Você ainda não possui agendamentos.
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}