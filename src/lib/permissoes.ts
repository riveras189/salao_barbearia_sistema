export const PERMISSOES = {
  clientes: ["ver", "criar", "editar", "excluir"],
  profissionais: ["ver", "criar", "editar", "excluir"],
  funcionarios: ["ver", "criar", "editar", "excluir"],
  agenda: ["ver", "criar", "editar", "cancelar", "bloquear"],
  comanda: ["ver", "abrir", "editar", "finalizar", "reabrir", "estornar"],
  estoque: ["ver", "entrada", "saida", "ajustar", "excluir"],
  financeiro: ["ver"],
  contas_pagar: ["ver", "criar", "editar", "baixar", "excluir"],
  contas_receber: ["ver", "criar", "editar", "baixar", "excluir"],
  caixa: ["ver", "abrir", "lancar", "fechar", "estornar"],
  relatorios: ["ver", "exportar"],
  usuarios: ["ver", "criar", "editar", "desativar", "permissoes"],
  empresa: ["ver", "editar", "alterar_modelo"],
  backup: ["ver", "gerar", "restaurar"],
} as const;

export function listarCodigosPermissao() {
  return Object.entries(PERMISSOES).flatMap(([modulo, acoes]) =>
    acoes.map((acao) => `${modulo}.${acao}`)
  );
}

export const PERFIS_BASE: Record<string, string[]> = {
  ADMIN: ["*"],
  GERENTE: [
    "clientes.ver", "clientes.criar", "clientes.editar",
    "profissionais.ver", "profissionais.criar", "profissionais.editar",
    "funcionarios.ver",
    "agenda.ver", "agenda.criar", "agenda.editar", "agenda.cancelar", "agenda.bloquear",
    "comanda.ver", "comanda.abrir", "comanda.editar", "comanda.finalizar", "comanda.reabrir",
    "estoque.ver", "estoque.entrada", "estoque.saida", "estoque.ajustar",
    "financeiro.ver",
    "contas_pagar.ver", "contas_pagar.criar", "contas_pagar.editar", "contas_pagar.baixar",
    "contas_receber.ver", "contas_receber.criar", "contas_receber.editar", "contas_receber.baixar",
    "caixa.ver", "caixa.abrir", "caixa.lancar", "caixa.fechar",
    "relatorios.ver", "relatorios.exportar",
    "empresa.alterar_modelo",
  ],
  ATENDENTE: [
    "clientes.ver", "clientes.criar", "clientes.editar",
    "agenda.ver", "agenda.criar", "agenda.editar", "agenda.cancelar",
    "comanda.ver", "comanda.abrir", "comanda.editar", "comanda.finalizar",
  ],
  FINANCEIRO: [
    "financeiro.ver",
    "contas_pagar.ver", "contas_pagar.criar", "contas_pagar.editar", "contas_pagar.baixar",
    "contas_receber.ver", "contas_receber.criar", "contas_receber.editar", "contas_receber.baixar",
    "caixa.ver", "caixa.abrir", "caixa.lancar", "caixa.fechar",
    "relatorios.ver", "relatorios.exportar",
  ],
  PROFISSIONAL: [
    "agenda.ver",
    "comanda.ver",
  ],
  ESTOQUE: [
    "estoque.ver", "estoque.entrada", "estoque.saida", "estoque.ajustar",
    "relatorios.ver",
  ],
};
