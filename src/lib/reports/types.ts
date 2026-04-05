export type ReportTipo =
  | "clientes"
  | "profissionais"
  | "profissionais-servicos"
  | "vendas"
  | "estoque"
  | "financeiro"
  | "pdv";

export type ReportFilters = {
  dia?: string;
  de?: string;
  ate?: string;
  clienteId?: string;
  profissionalId?: string;
  servicoId?: string;
  produtoId?: string;
  status?: string;
  q?: string;
};

export type ReportColumn = {
  key: string;
  label: string;
  align?: "left" | "center" | "right";
  type?: "text" | "date" | "money" | "number";
};

export type ReportSummaryCard = {
  label: string;
  value: string | number;
};

export type ReportCompany = {
  companyName: string;
  logoUrl?: string | null;
};

export type ReportData = {
  tipo: ReportTipo;
  title: string;
  subtitle?: string;
  generatedAt: string;
  filters: ReportFilters;
  company: ReportCompany;
  summary: ReportSummaryCard[];
  columns: ReportColumn[];
  rows: Array<Record<string, unknown>>;
};