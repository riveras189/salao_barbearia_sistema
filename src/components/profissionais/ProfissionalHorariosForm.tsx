import { saveProfissionalHorariosAction } from "@/actions/profissionais";
import { diasSemana } from "@/schemas/profissional";

type HorarioItem = {
  diaSemana: number;
  horaInicio: string;
  horaFim: string;
  intervaloInicio: string | null;
  intervaloFim: string | null;
  ativo: boolean;
};

type Props = {
  profissionalId: string;
  horarios: HorarioItem[];
};

export default function ProfissionalHorariosForm({
  profissionalId,
  horarios,
}: Props) {
  const byDay = new Map(horarios.map((item) => [item.diaSemana, item]));

  return (
    <form
      action={saveProfissionalHorariosAction}
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <input type="hidden" name="profissionalId" value={profissionalId} />

      <div className="mb-6">
        <h2 className="text-lg font-semibold text-slate-900">
          Horários de trabalho
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Marque os dias ativos e defina os horários do profissional.
        </p>
      </div>

      <div className="space-y-4">
        {diasSemana.map((dia) => {
          const item = byDay.get(dia.value);

          return (
            <div
              key={dia.value}
              className="rounded-2xl border border-slate-200 p-4"
            >
              <div className="mb-4 flex items-center gap-3">
                <input
                  id={`dia_${dia.value}_ativo`}
                  name={`dia_${dia.value}_ativo`}
                  type="checkbox"
                  value="1"
                  defaultChecked={Boolean(item?.ativo)}
                  className="h-4 w-4 rounded border-slate-300"
                />
                <label
                  htmlFor={`dia_${dia.value}_ativo`}
                  className="text-sm font-semibold text-slate-900"
                >
                  {dia.label}
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Início
                  </label>
                  <input
                    name={`dia_${dia.value}_horaInicio`}
                    type="time"
                    defaultValue={item?.horaInicio || ""}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-900"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Fim
                  </label>
                  <input
                    name={`dia_${dia.value}_horaFim`}
                    type="time"
                    defaultValue={item?.horaFim || ""}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-900"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Intervalo início
                  </label>
                  <input
                    name={`dia_${dia.value}_intervaloInicio`}
                    type="time"
                    defaultValue={item?.intervaloInicio || ""}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-900"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Intervalo fim
                  </label>
                  <input
                    name={`dia_${dia.value}_intervaloFim`}
                    type="time"
                    defaultValue={item?.intervaloFim || ""}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-900"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6">
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
        >
          Salvar horários
        </button>
      </div>
    </form>
  );
}