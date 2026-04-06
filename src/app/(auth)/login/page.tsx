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
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden" style={{ background: "var(--login-bg)" }}>
      <div 
        className="absolute inset-0 z-0 opacity-40 animate-gradient"
          style={{
            background: "var(--login-glow-top), var(--login-glow-bottom)",
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

      <div className="absolute top-1/4 left-1/4 h-64 w-64 rounded-full blur-3xl animate-float" style={{ animationDelay: '0s', background: 'color-mix(in srgb, var(--brand-color) 18%, transparent)' }} />
      <div className="absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s', background: 'color-mix(in srgb, var(--accent) 18%, transparent)' }} />

      <div className="relative z-10 w-full max-w-md px-4">
        <div className="w-full rounded-[2rem] p-8 shadow-2xl backdrop-blur-2xl" style={{ border: '1px solid var(--login-panel-border)', background: 'var(--login-panel)' }}>
          
          <div className="mb-8 text-center flex flex-col items-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg" style={{ background: 'var(--login-icon)', boxShadow: 'var(--shadow-brand)' }}>
              <Scissors className="h-6 w-6 text-white" />
            </div>
            <p className="text-xs font-bold uppercase tracking-[0.25em]" style={{ color: 'var(--login-text)' }}>
              <span className="login-brand-default">RF Sistema</span>
              <span className="login-brand-barbearia">Barbearia Sistema</span>
              <span className="login-brand-personalizado">Sistema Personalizado</span>
            </p>
            <h1 className="font-display mt-2 text-3xl font-bold tracking-tight" style={{ color: 'var(--login-text)' }}>
              Bem-vindo
            </h1>
            <p className="mt-2 text-sm" style={{ color: 'var(--login-muted)' }}>
              <span className="login-copy-default">Faça login para acessar o painel do sistema.</span>
              <span className="login-copy-barbearia">Faça login para acessar o painel da barbearia.</span>
              <span className="login-copy-personalizado">Faça login para acessar o painel personalizado.</span>
            </p>
          </div>

          {error ? (
            <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200 backdrop-blur-md">
              {error}
            </div>
          ) : null}

          <form action={loginAction} className="space-y-5">
            <div>
              <label htmlFor="login" className="mb-1.5 block text-sm font-bold" style={{ color: 'var(--login-text)', fontWeight: 700 }}>
                Login ou e-mail
              </label>
              <input
                id="login"
                name="login"
                type="text"
                required
                className="w-full rounded-2xl px-4 py-3 text-sm outline-none transition-all"
                style={{ background: 'var(--login-field-bg)', border: '1px solid var(--login-field-border)', color: 'var(--login-text)' }}
                placeholder="Ex: admin"
              />
            </div>

            <div>
              <label htmlFor="senha" className="mb-1.5 block text-sm font-bold" style={{ color: 'var(--login-text)', fontWeight: 700 }}>
                Senha
              </label>
              <input
                id="senha"
                name="senha"
                type="password"
                required
                className="w-full rounded-2xl px-4 py-3 text-sm outline-none transition-all"
                style={{ background: 'var(--login-field-bg)', border: '1px solid var(--login-field-border)', color: 'var(--login-text)' }}
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              className="mt-6 w-full rounded-2xl px-4 py-3.5 text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ color: '#fff', background: 'var(--login-button)' }}
            >
              Entrar no painel
            </button>
          </form>

        </div>
        
        <div className="mt-8 text-center">
          <p className="text-xs" style={{ color: 'var(--login-muted)' }}>
            &copy; {new Date().getFullYear()} RF_Sistema. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </main>
  );
}
