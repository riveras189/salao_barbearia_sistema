import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import PageHeader from "@/components/layout/PageHeader";
import PanelBackButton from "@/components/PanelBackButton";
import { desativarUsuarioAction } from "@/actions/usuarios";

export default async function UsuariosPage() {
  const user = await requireUser();

  const usuarios = await prisma.usuario.findMany({
    where: {
      empresaId: user.empresaId,
    },
    include: {
      funcionario: true,
      profissional: true,
    },
    orderBy: {
      nome: "asc",
    },
  });

  return (
    <div className="space-y-6">
      <PanelBackButton />

      <PageHeader
        title="Usuários"
        description="Gerencie os acessos do sistema."
      />

      <div className="flex items-center justify-end">
        <Link
          href="/usuarios/novo"
          className="inline-flex items-center justify-center rounded-2xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          Novo usuário
        </Link>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left text-slate-600">
                <th className="px-4 py-3 font-semibold">Nome</th>
                <th className="px-4 py-3 font-semibold">Login</th>
                <th className="px-4 py-3 font-semibold">Papel</th>
                <th className="px-4 py-3 font-semibold">Vínculo</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Último login</th>
                <th className="px-4 py-3 font-semibold text-right">Ações</th>
              </tr>
            </thead>

            <tbody>
              {usuarios.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-slate-500">
                    Nenhum usuário cadastrado.
                  </td>
                </tr>
              ) : (
                usuarios.map((usuario) => {
                  const vinculo =
                    usuario.funcionario?.nome ||
                    usuario.profissional?.nome ||
                    "-";

                  const ultimoLogin = usuario.ultimoLoginEm
                    ? new Date(usuario.ultimoLoginEm).toLocaleString("pt-BR")
                    : "-";

                  return (
                    <tr key={usuario.id} className="border-t border-slate-100">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{usuario.nome}</div>
                        {usuario.email ? (
                          <div className="text-xs text-slate-500">{usuario.email}</div>
                        ) : null}
                      </td>

                      <td className="px-4 py-3 text-slate-700">{usuario.login}</td>

                      <td className="px-4 py-3 text-slate-700">
                        {String(usuario.papelBase)}
                      </td>

                      <td className="px-4 py-3 text-slate-700">{vinculo}</td>

                      <td className="px-6 py-3">
                        {usuario.ativo ? (
                          <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                            Ativo
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
                            Inativo
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-slate-700">{ultimoLogin}</td>

                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/usuarios/${usuario.id}/editar`}
                            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                          >
                            Editar
                          </Link>

                          {usuario.ativo ? (
                            <form action={desativarUsuarioAction.bind(null, usuario.id)}>
                              <button
                                type="submit"
                                className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
                              >
                                Desativar
                              </button>
                            </form>
                          ) : (
                            <span className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-500">
                              Desativado
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}