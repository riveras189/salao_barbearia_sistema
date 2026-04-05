type UsuarioFormProps = {
  funcionarios: Array<{ id: string; nome: string }>;
  profissionais: Array<{ id: string; nome: string }>;
  action: (formData: FormData) => void;
};

export default function UsuarioForm({
  funcionarios,
  profissionais,
  action,
}: UsuarioFormProps) {
  return (
    <form action={action} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Nome</label>
          <input
            name="nome"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none"
            placeholder="Nome do usuário"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">E-mail</label>
          <input
            type="email"
            name="email"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none"
            placeholder="email@exemplo.com"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Login</label>
          <input
            name="login"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none"
            placeholder="Login do usuário"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Senha</label>
          <input
            type="password"
            name="senha"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none"
            placeholder="Digite a senha"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Papel</label>
          <select
            name="papelBase"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none"
            required
            defaultValue=""
          >
            <option value="">Selecione</option>
            <option value="ADMIN">ADMIN</option>
            <option value="GERENTE">GERENTE</option>
            <option value="ATENDENTE">ATENDENTE</option>
            <option value="FINANCEIRO">FINANCEIRO</option>
            <option value="PROFISSIONAL">PROFISSIONAL</option>
            <option value="ESTOQUE">ESTOQUE</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Funcionário</label>
          <select
            name="funcionarioId"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none"
            defaultValue=""
          >
            <option value="">Nenhum</option>
            {funcionarios.map((item) => (
              <option key={item.id} value={item.id}>
                {item.nome}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Profissional</label>
          <select
            name="profissionalId"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none"
            defaultValue=""
          >
            <option value="">Nenhum</option>
            {profissionais.map((item) => (
              <option key={item.id} value={item.id}>
                {item.nome}
              </option>
            ))}
          </select>
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" name="ativo" defaultChecked />
        Usuário ativo
      </label>

      <button
        type="submit"
        className="inline-flex items-center justify-center rounded-2xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
      >
        Salvar usuário
      </button>
    </form>
  );
}