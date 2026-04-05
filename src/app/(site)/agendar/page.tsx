import Link from "next/link";
import { prisma } from "@/lib/prisma";
import PublicBookingForm from "./PublicBookingForm";

export default async function SiteAgendarPage() {
  const empresa = await prisma.empresa.findFirst({
    where: { ativo: true },
    orderBy: { createdAt: "asc" },
    include: {
      agendamentoOnlineConfig: true,
    },
  });

  if (!empresa) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <h1 className="text-3xl font-bold text-slate-900">
            Empresa não encontrada
          </h1>
          <p className="mt-3 text-slate-600">
            Não foi possível localizar a empresa para o agendamento online.
          </p>
        </div>
      </main>
    );
  }

  const [servicos, profissionais] = await Promise.all([
    prisma.servico.findMany({
      where: {
        empresaId: empresa.id,
        ativo: true,
        exibirNoSite: true,
      },
      select: {
        id: true,
        nome: true,
        descricao: true,
        duracaoMin: true,
        preco: true,
      },
      orderBy: { nome: "asc" },
    }),
    prisma.profissional.findMany({
      where: {
        empresaId: empresa.id,
        ativo: true,
      },
      select: {
        id: true,
        nome: true,
      },
      orderBy: { nome: "asc" },
    }),
  ]);

  const nomeEmpresa =
    empresa.nomeFantasia || empresa.razaoSocial || "Salão de Beleza";

  const whatsappLink = empresa.whatsapp
    ? `https://wa.me/${empresa.whatsapp.replace(/\D+/g, "")}`
    : null;

  const onlineDesativado = !empresa.agendamentoOnlineConfig?.ativo;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/"
              className="mb-3 inline-flex text-sm font-medium text-slate-500 hover:text-slate-900"
            >
              ← Voltar para o site
            </Link>

            <h1 className="text-4xl font-bold text-slate-900">
              Agendar horário
            </h1>
            <p className="mt-2 text-slate-600">
              {nomeEmpresa} — escolha o profissional, os serviços e o melhor
              horário.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/login"
              className="inline-flex items-center rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Entrar no sistema
            </Link>

            <Link
              href="/cliente/cadastro"
              className="inline-flex items-center rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Criar cadastro
            </Link>

            <Link
              href="/cliente/criar-senha"
              className="inline-flex items-center rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Criar senha
            </Link>

            <Link
              href="/cliente/login"
              className="inline-flex items-center rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Minha agenda
            </Link>
          </div>
        </div>

        {onlineDesativado ? (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            O agendamento online está marcado como desativado no cadastro da empresa.
            A página continua visível para teste.
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.15fr,0.85fr]">
          <PublicBookingForm
            servicos={servicos.map((item) => ({
              id: item.id,
              nome: item.nome,
              descricao: item.descricao,
              duracaoMin: item.duracaoMin,
              preco: item.preco.toString(),
            }))}
            profissionais={profissionais}
          />

          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900">
                Área do cliente
              </h2>

              <p className="mt-3 text-sm text-slate-600">
                O cliente não entra no sistema interno do salão. Aqui ele cria
                um cadastro separado para acompanhar apenas os próprios
                agendamentos.
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href="/cliente/cadastro"
                  className="inline-flex items-center rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Criar cadastro
                </Link>

                <Link
                  href="/cliente/login"
                  className="inline-flex items-center rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Já tenho conta
                </Link>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900">Contato</h2>

              {empresa.telefone ? (
                <p className="mt-4 text-sm text-slate-600">
                  Telefone: {empresa.telefone}
                </p>
              ) : null}

              {empresa.whatsapp ? (
                <p className="mt-2 text-sm text-slate-600">
                  WhatsApp: {empresa.whatsapp}
                </p>
              ) : null}

              {empresa.email ? (
                <p className="mt-2 text-sm text-slate-600">
                  E-mail: {empresa.email}
                </p>
              ) : null}
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-900 p-6 text-white shadow-sm">
              <h2 className="text-xl font-bold">Precisa de ajuda?</h2>
              <p className="mt-3 text-sm text-slate-200">
                Se preferir, fale diretamente com a equipe para confirmar
                detalhes do atendimento.
              </p>

              {whatsappLink ? (
                <a
                  href={whatsappLink}
                  target="_blank"
                  className="mt-5 inline-flex items-center rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-900"
                >
                  Falar no WhatsApp
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}