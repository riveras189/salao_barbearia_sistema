import { redirect } from "next/navigation";
import { loginWithCredentials, getSessionUser } from "@/lib/auth";
import { Scissors } from "lucide-react";

type Props = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const user = await getSessionUser();
  if (user) redirect("/dashboard");

  const params = (await searchParams) || {};
  const error = params.error;

  async function loginAction(formData: FormData) {
    "use server";

    const login = String(formData.get("login") || "");
    const senha = String(formData.get("senha") || "");

    const result = await loginWithCredentials(login, senha);

    if (!result.ok) {
      redirect(`/login?error=${encodeURIComponent(result.error || "Erro desconhecido")}`);
    }

    redirect("/dashboard");
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#120f0d]">
      {/* Animated gradient background layers */}
      <div 
        className="absolute inset-0 z-0 opacity-40 animate-gradient"
          style={{
            background: "radial-gradient(circle at top right, rgba(200,155,60,0.22) 0%, transparent 50%), radial-gradient(circle at bottom left, rgba(139,30,36,0.26) 0%, transparent 50%)",
            filter: "blur(60px)"
          }}
        />
      <div
        className="absolute inset-0 z-0 opacity-20 mix-blend-overlay"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.08) 0.7px, transparent 0.7px)",
          backgroundSize: "12px 12px",
        }}
      ></div>

      {/* Floating orbs */}
      <div className="absolute top-1/4 left-1/4 h-64 w-64 rounded-full bg-amber-500/20 blur-3xl animate-float" style={{ animationDelay: '0s' }} />
      <div className="absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-red-900/20 blur-3xl animate-float" style={{ animationDelay: '2s' }} />

      <div className="relative z-10 w-full max-w-md px-4">
        <div className="w-full rounded-[2rem] border border-white/10 bg-white/[0.03] p-8 shadow-2xl backdrop-blur-2xl">
          
          <div className="mb-8 text-center flex flex-col items-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-red-900 shadow-lg shadow-amber-700/30">
              <Scissors className="h-6 w-6 text-white" />
            </div>
            <p className="text-xs font-bold uppercase tracking-[0.25em]" style={{color: '#fff'}}>
              Barbearia Sistema
            </p>
            <h1 className="font-display mt-2 text-3xl font-bold tracking-tight text-white">
              Bem-vindo
            </h1>
            <p className="mt-2 text-sm" style={{color: '#fff'}}>
              Faça login para acessar o painel da barbearia.
            </p>
          </div>

          {error ? (
            <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200 backdrop-blur-md">
              {error}
            </div>
          ) : null}

          <form action={loginAction} className="space-y-5">
            <div>
              <label htmlFor="login" className="mb-1.5 block text-sm font-bold" style={{color: '#fff !important', fontWeight: 700}}>
                Login ou e-mail
              </label>
              <input
                id="login"
                name="login"
                type="text"
                required
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition-all placeholder:text-slate-100 focus:border-amber-400 focus:bg-white/10 focus:ring-1 focus:ring-amber-400"
                placeholder="Ex: admin"
              />
            </div>

            <div>
              <label htmlFor="senha" className="mb-1.5 block text-sm font-bold" style={{color: '#fff !important', fontWeight: 700}}>
                Senha
              </label>
              <input
                id="senha"
                name="senha"
                type="password"
                required
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition-all placeholder:text-slate-100 focus:border-amber-400 focus:bg-white/10 focus:ring-1 focus:ring-amber-400"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              className="mt-6 w-full rounded-2xl bg-gradient-to-r from-amber-500 to-red-900 px-4 py-3.5 text-sm font-bold transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-amber-700/25 active:scale-[0.98]"
              style={{color: '#fff !important'}}
            >
              Entrar no painel
            </button>
          </form>

        </div>
        
        <div className="mt-8 text-center">
          <p className="text-xs" style={{color: '#fff'}}>
            &copy; {new Date().getFullYear()} Barbearia Sistema. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </main>
  );
}
