import Link from "next/link";
import { toggleProfissionalAtivo } from "@/actions/profissionais";

type ProfissionalTableItem = {
  id: string;
  nome: string;
  cpf: string | null;
  cnpj: string | null;
  telefone: string | null;
  whatsapp: string | null;
  email: string | null;
  corAgenda: string | null;
  ativo: boolean;
  fotoUrl: string | null;
};

type ProfissionalTableProps = {
  items: ProfissionalTableItem[];
};

function formatCpf(value?: string | null) {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.length !== 11) return value || "—";
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

function formatCnpj(value?: string | null) {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.length !== 14) return value || "—";
  return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
}

function formatPhone(value?: string | null) {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return "—";
  if (digits.length === 11) return digits.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  if (digits.length === 10) return digits.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  return value || "—";
}

function getInitials(name?: string | null) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) return "P";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export default function ProfissionalTable({ items }: ProfissionalTableProps) {
  if (!items.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">
          Nenhum profissional encontrado
        </h3>
        <p className="mt-2 text-sm text-slate-500">
          Cadastre o primeiro profissional ou ajuste o filtro da pesquisa.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-700">
                Nome
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-700">
                CPF/CNPJ
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-700">
                Contato
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-700">
                Cor
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-700">
                Status
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-700">
                Ações
              </th>
            </tr>
          </thead>

          <tbody>
            {items.map((profissional) => (
              <tr key={profissional.id} className="border-t border-slate-200">
                <td className="px-4 py-4 align-top">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100 shadow-sm">
                      {profissional.fotoUrl ? (
                        <img
                          src={profissional.fotoUrl}
                          alt={profissional.nome}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-semibold text-slate-700">
                          {getInitials(profissional.nome)}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900">
                        {profissional.nome}
                      </div>
                      <div className="mt-1 text-xs text-slate-700 truncate">
                        {profissional.email || "Sem e-mail"}
                      </div>
                    </div>
                  </div>
                </td>

                <td className="px-4 py-4 text-sm text-slate-700">
                  {profissional.cpf
                    ? formatCpf(profissional.cpf)
                    : profissional.cnpj
                    ? formatCnpj(profissional.cnpj)
                    : "—"}
                </td>

                <td className="px-4 py-4 text-sm text-slate-700">
                  {formatPhone(profissional.whatsapp || profissional.telefone)}
                </td>

                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-5 w-5 rounded-full border border-slate-300"
                      style={{ backgroundColor: profissional.corAgenda || "#1d4ed8" }}
                    />
                    <span className="text-sm text-slate-700">
                      {profissional.corAgenda || "#1d4ed8"}
                    </span>
                  </div>
                </td>

                <td className="px-4 py-4">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                      profissional.ativo
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {profissional.ativo ? "Ativo" : "Inativo"}
                  </span>
                </td>

                <td className="px-4 py-4">
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <Link
                      href={`/profissionais/${profissional.id}`}
                      className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      Ver
                    </Link>

                    <Link
                      href={`/profissionais/${profissional.id}/editar`}
                      className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      Editar
                    </Link>

                    <Link
                      href={`/profissionais/${profissional.id}/horarios`}
                      className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      Horários
                    </Link>

                    <Link
                      href={`/profissionais/${profissional.id}/servicos`}
                      className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      Serviços
                    </Link>

                    <form action={toggleProfissionalAtivo}>
                      <input type="hidden" name="id" value={profissional.id} />
                      <button
                        type="submit"
                        className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        {profissional.ativo ? "Inativar" : "Ativar"}
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}