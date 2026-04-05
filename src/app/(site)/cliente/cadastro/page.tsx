import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getClienteSessionUser } from "@/lib/auth-cliente";

export default async function ClienteCadastroPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string; ok?: string }>;
}) {
  const clienteLogado = await getClienteSessionUser();
  if (clienteLogado) redirect("/cliente/agenda");

  const params = (await searchParams) || {};
  const error = typeof params.error === "string" ? params.error : "";
  const ok = typeof params.ok === "string" ? params.ok : "";

  async function cadastroAction(formData: FormData) {
    "use server";

    const empresa = await prisma.empresa.findFirst({
      where: { ativo: true },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });

    if (!empresa) {
      redirect("/cliente/cadastro?error=Empresa%20não%20encontrada.");
    }

    const nome = String(formData.get("nome") ?? "").trim();
    const telefone = String(formData.get("telefone") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const login = String(formData.get("login") ?? "").trim().toLowerCase();
    const senha = String(formData.get("senha") ?? "");
    const confirmarSenha = String(formData.get("confirmarSenha") ?? "");

    if (!nome || !telefone || !login || !senha || !confirmarSenha) {
      redirect(
        "/cliente/cadastro?error=Preencha%20todos%20os%20campos%20obrigatórios."
      );
    }

    if (senha !== confirmarSenha) {
      redirect("/cliente/cadastro?error=As%20senhas%20não%20coincidem.");
    }

    if (senha.length < 4) {
      redirect("/cliente/cadastro?error=A%20senha%20deve%20ter%20pelo%20menos%204%20caracteres.");
    }

    const telefoneLimpo = telefone.replace(/\D+/g, "");

    let clienteExistente = await prisma.cliente.findFirst({
      where: {
        empresaId: empresa.id,
        OR: [
          { telefone: telefone },
          { telefone: telefoneLimpo },
          { whatsapp: telefone },
          { whatsapp: telefoneLimpo },
          ...(email ? [{ email }] : []),
        ],
      },
      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true,
        whatsapp: true,
      },
    });

    const acessoComMesmoLogin = await prisma.clienteAcesso.findFirst({
      where: {
        empresaId: empresa.id,
        login,
      },
      select: {
        id: true,
        clienteId: true,
      },
    });

    if (acessoComMesmoLogin) {
      const loginPertenceAoMesmoCliente =
        !!clienteExistente &&
        acessoComMesmoLogin.clienteId === clienteExistente.id;

      if (!loginPertenceAoMesmoCliente) {
        redirect("/cliente/cadastro?error=Esse%20login%20já%20está%20em%20uso.");
      }
    }

    if (!clienteExistente) {
      clienteExistente = await prisma.cliente.create({
        data: {
          empresaId: empresa.id,
          nome,
          telefone: telefoneLimpo || telefone,
          whatsapp: telefoneLimpo || telefone,
          email: email || null,
          origemCadastro: "SITE",
          ativo: true,
        },
        select: {
          id: true,
          nome: true,
          email: true,
          telefone: true,
          whatsapp: true,
        },
      });
    } else {
      await prisma.cliente.update({
        where: { id: clienteExistente.id },
        data: {
          nome,
          telefone: telefoneLimpo || telefone,
          whatsapp: telefoneLimpo || telefone,
          email: email || clienteExistente.email || null,
          ativo: true,
        },
      });
    }

    const senhaHash = await bcrypt.hash(senha, 10);

    await prisma.clienteAcesso.upsert({
      where: {
        clienteId: clienteExistente.id,
      },
      update: {
        login,
        senhaHash,
        ativo: true,
      },
      create: {
        empresaId: empresa.id,
        clienteId: clienteExistente.id,
        login,
        senhaHash,
        ativo: true,
      },
    });

    redirect("/cliente/login?ok=Cadastro%20criado%20com%20sucesso.");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-900">Criar cadastro</h1>
        <p className="mt-2 text-sm text-slate-600">
          Crie sua conta para agendar e acompanhar seus horários.
        </p>

        {error ? (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {ok ? (
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {ok}
          </div>
        ) : null}

        <form action={cadastroAction} className="mt-6 space-y-4">
          <input
            name="nome"
            placeholder="Nome"
            className="w-full rounded-2xl border px-4 py-3"
            required
          />
          <input
            name="telefone"
            placeholder="Telefone / WhatsApp"
            className="w-full rounded-2xl border px-4 py-3"
            required
          />
          <input
            name="email"
            type="email"
            placeholder="E-mail"
            className="w-full rounded-2xl border px-4 py-3"
          />
          <input
            name="login"
            placeholder="Login para entrar"
            className="w-full rounded-2xl border px-4 py-3"
            required
          />
          <input
            name="senha"
            type="password"
            placeholder="Senha"
            className="w-full rounded-2xl border px-4 py-3"
            required
          />
          <input
            name="confirmarSenha"
            type="password"
            placeholder="Confirmar senha"
            className="w-full rounded-2xl border px-4 py-3"
            required
          />

          <button className="w-full rounded-2xl bg-slate-900 px-4 py-3 font-semibold text-white">
            Criar cadastro
          </button>
        </form>
      </div>
    </main>
  );
}