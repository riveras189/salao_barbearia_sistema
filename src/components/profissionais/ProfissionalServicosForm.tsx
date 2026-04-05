import { saveProfissionalServicosAction } from "@/actions/profissionais";

type ServicoItem = {
  id: string;
  nome: string;
  preco: string;
  duracaoMin: number;
  ativo: boolean;
};

type Props = {
  profissionalId: string;
  servicos: ServicoItem[];
  selectedIds: string[];
};

function formatMoney(value: string) {
  const n = Number(value || 0);
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(n);
}

export default function ProfissionalServicosForm({
  profissionalId,
  servicos,
  selectedIds,
}: Props) {
  const selected = new Set(selectedIds);

  return (
    <form
      action={saveProfissionalServicosAction}
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <input type="hidden" name="profissionalId" value={profissionalId} />

      <div className="mb-6">
        <h2 className="text-lg font-semibold text-slate-900">
          Serviços habilitados
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Marque os serviços que este profissional pode executar.
        </p>
      </div>

      <div className="space-y-3">
        {servicos.map((servico) => (
          <label
            key={servico.id}
            className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 p-4 hover:bg-slate-50"
          >
            <input
              type="checkbox"
              name="servicoIds"
              value={servico.id}
              defaultChecked={selected.has(servico.id)}
              className="mt-1 h-4 w-4 rounded border-slate-300"
            />

            <div className="min-w-0 flex-1">
              <div className="font-semibold text-slate-900">{servico.nome}</div>
              <div className="mt-1 text-sm text-slate-500">
                {formatMoney(servico.preco)} • {servico.duracaoMin} min
              </div>
            </div>

            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                servico.ativo
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-slate-200 text-slate-700"
              }`}
            >
              {servico.ativo ? "Ativo" : "Inativo"}
            </span>
          </label>
        ))}
      </div>

      <div className="mt-6">
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
        >
          Salvar serviços
        </button>
      </div>
    </form>
  );
}