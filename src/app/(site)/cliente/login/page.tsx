import { redirect } from "next/navigation";
import Link from "next/link";
import {
  getClienteSessionUser,
  loginClienteWithCredentials,
} from "@/lib/auth-cliente";

export default async function ClienteLoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const cliente = await getClienteSessionUser();
  if (cliente) redirect("/cliente/agenda");

  const params = (await searchParams) || {};
  const error = typeof params.error === "string" ? params.error : "";

  async function loginAction(formData: FormData) {
    "use server";

    const login = String(formData.get("login") ?? "").trim();
    const senha = String(formData.get("senha") ?? "");

    const result = await loginClienteWithCredentials(login, senha);

    if (!result.ok) {
      redirect(
        `/cliente/login?error=${encodeURIComponent(
          result.error || "Login inválido."
        )}`
      );
    }

    redirect("/cliente/agenda");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-900">Entrar</h1>
        <p className="mt-2 text-sm text-slate-600">
          Acesse sua área para ver seus agendamentos.
        </p>

        {error ? (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <form action={loginAction} className="mt-6 space-y-4">
          <input
            name="login"
            placeholder="Login"
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

          <button className="w-full rounded-2xl bg-slate-900 px-4 py-3 font-semibold text-white">
            Entrar
          </button>
        </form>

        <div className="mt-6 border-t border-slate-200 pt-6 space-y-3 text-center">
          <p className="text-sm text-slate-600">
            Não tem senha ainda?{" "}
            <Link
              href="/cliente/criar-senha"
              className="font-semibold text-slate-900 hover:underline"
            >
              Criar senha
            </Link>
          </p>
          <p className="text-sm text-slate-600">
            Não tem cadastro?{" "}
            <Link
              href="/cliente/cadastro"
              className="font-semibold text-slate-900 hover:underline"
            >
              Cadastre-se
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}