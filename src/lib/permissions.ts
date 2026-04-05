import type { SessionUser } from "@/lib/auth";

const rolePermissions: Record<string, string[]> = {
  ADMIN: ["*"],
  GERENTE: [
    "dashboard.view",
    "clientes.*",
    "profissionais.*",
    "funcionarios.*",
    "empresa.view",
    "empresa.update",
    "servicos.*",
    "produtos.*",
    "agenda.*",
    "comandas.*",
    "financeiro.*",
    "relatorios.*",
    "usuarios.view",
    "site.*",
    "auditoria.view",
  ],
  RECEPCIONISTA: [
    "dashboard.view",
    "clientes.*",
    "agenda.*",
    "comandas.*",
    "financeiro.caixa.view",
    "financeiro.caixa.create",
    "relatorios.view",
  ],
  PROFISSIONAL: [
    "dashboard.view",
    "agenda.self",
    "comandas.self",
    "clientes.view",
    "relatorios.self",
  ],
};

export function hasPermission(user: SessionUser, permission: string) {
  const list = rolePermissions[user.papelBase] || [];
  if (list.includes("*")) return true;
  if (list.includes(permission)) return true;

  const [module] = permission.split(".");
  if (list.includes(`${module}.*`)) return true;

  return false;
}