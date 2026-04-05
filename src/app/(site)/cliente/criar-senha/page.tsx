import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getClienteSessionUser } from "@/lib/auth-cliente";

export default async function CriarSenhaPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string; ok?: string; telefone?: string }>;
}) {
  const clienteLogado = await getClienteSessionUser();
  if (clienteLogado) redirect("/cliente/agenda");

  const params = (await searchParams) || {};
  const error = typeof params.error === "string" ? params.error : "";
  const ok = typeof params.ok === "string" ? params.ok : "";
  const telefonePré = typeof params.telefone === "string" ? params.telefone : "";

  async function criarSenhaAction(formData: FormData) {
    "use server";

    const empresa = await prisma.empresa.findFirst({
      where: { ativo: true },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });

    if (!empresa) {
      redirect("/cliente/criar-senha?error=Empresa%20não%20encontrada.");
    }

    const telefone = String(formData.get("telefone") ?? "").trim();
    const login = String(formData.get("login") ?? "").trim().toLowerCase();
    const senha = String(formData.get("senha") ?? "");
    const confirmarSenha = String(formData.get("confirmarSenha") ?? "");

    if (!telefone) {
      redirect(
        "/cliente/criar-senha?error=Informe%20seu%20telefone%20para%20localizarmos%20seu%20cadastro."
      );
    }

    if (!login || !senha || !confirmarSenha) {
      redirect(
        "/cliente/criar-senha?error=Preencha%20todos%20os%20campos%20obrigatórios."
      );
    }

    if (senha !== confirmarSenha) {
      redirect("/cliente/criar-senha?error=As%20senhas%20não%20coincidem.");
    }

    if (senha.length < 4) {
      redirect(
        "/cliente/criar-senha?error=A%20senha%20deve%20ter%20pelo%20menos%204%20caracteres."
      );
    }

    const telefoneLimpo = telefone.replace(/\D+/g, "");

    // Buscar cliente por telefone
    const cliente = await prisma.cliente.findFirst({
      where: {
        empresaId: empresa.id,
        OR: [
          { telefone: telefone },
          { telefone: telefoneLimpo },
          { whatsapp: telefone },
          { whatsapp: telefoneLimpo },
        ],
      },
      select: {
        id: true,
        nome: true,
      },
    });

    if (!cliente) {
      redirect(
        "/cliente/criar-senha?error=Cliente%20não%20encontrado.%20Verifique%20o%20telefone%20informado."
      );
    }

    // Verificar se já tem acesso
    const acessoExistente = await prisma.clienteAcesso.findFirst({
      where: {
        clienteId: cliente.id,
        empresaId: empresa.id,
      },
    });

    if (acessoExistente) {
      redirect(
        "/cliente/criar-senha?error=Este%20cliente%20já%20possui%20login.%20Tente%20fazer%20login%20normalmente."
      );
    }

    // Verificar se o login já existe
    const loginEmUso = await prisma.clienteAcesso.findFirst({
      where: {
        empresaId: empresa.id,
        login,
      },
    });

    if (loginEmUso) {
      redirect(
        "/cliente/criar-senha?error=Esse%20login%20já%20está%20em%20uso.%20Escolha%20outro."
      );
    }

    // Criar o acesso
    const senhaCriptografada = bcrypt.hashSync(senha, 10);

    await prisma.clienteAcesso.create({
      data: {
        empresaId: empresa.id,
        clienteId: cliente.id,
        login,
        senhaHash: senhaCriptografada,
      },
    });

    redirect("/cliente/login?ok=Senha%20criada%20com%20sucesso.%20Faça%20login%20com%20seus%20dados.");
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-3xl border border-slate-700 bg-slate-800 p-8 shadow-2xl">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-white">Criar senha</h1>
            <p className="mt-2 text-sm text-slate-400">
              Configure seu login para agendar e gerenciar seus horários
            </p>
          </div>

          {error ? (
            <div className="mb-6 rounded-2xl border border-red-600 bg-red-900/20 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          ) : null}

          {ok ? (
            <div className="mb-6 rounded-2xl border border-emerald-600 bg-emerald-900/20 px-4 py-3 text-sm text-emerald-300">
              {ok}
            </div>
          ) : null}

          <form action={criarSenhaAction} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-200">
                Telefone/WhatsApp *
              </label>
              <input
                type="tel"
                name="telefone"
                defaultValue={telefonePré}
                required
                placeholder="(17) 99999-9999"
                className="w-full rounded-xl border border-slate-600 bg-slate-700 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-500/20"
              />
              <p className="mt-1 text-xs text-slate-400">
                O telefone que você usou para se cadastrar
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-200">
                Usuário (login) *
              </label>
              <input
                type="text"
                name="login"
                required
                placeholder="Escolha um usuário"
                className="w-full rounded-xl border border-slate-600 bg-slate-700 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-500/20"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-200">
                Senha *
              </label>
              <input
                type="password"
                name="senha"
                required
                placeholder="Mínimo 4 caracteres"
                className="w-full rounded-xl border border-slate-600 bg-slate-700 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-500/20"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-200">
                Confirmar senha *
              </label>
              <input
                type="password"
                name="confirmarSenha"
                required
                placeholder="Repita a senha"
                className="w-full rounded-xl border border-slate-600 bg-slate-700 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-500/20"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-slate-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500/50"
            >
              Criar senha
            </button>
          </form>

          <div className="mt-6 border-t border-slate-700 pt-6 text-center">
            <p className="text-sm text-slate-400">
              Já tem login?{" "}
              <Link
                href="/cliente/login"
                className="font-semibold text-slate-200 hover:text-white"
              >
                Faça login
              </Link>
            </p>
            <p className="mt-3 text-sm text-slate-400">
              Não tem cadastro?{" "}
              <Link
                href="/cliente/cadastro"
                className="font-semibold text-slate-200 hover:text-white"
              >
                Cadastre-se
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
