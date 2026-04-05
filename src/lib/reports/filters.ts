import type { ReportFilters } from "./types";

export function getReportFilters(
  params: Record<string, string | string[] | undefined>
): ReportFilters {
  const get = (key: string) => {
    const value = params[key];
    return Array.isArray(value) ? value[0] : value;
  };

  return {
    dia: get("dia"),
    de: get("de"),
    ate: get("ate"),
    clienteId: get("clienteId"),
    profissionalId: get("profissionalId"),
    servicoId: get("servicoId"),
    produtoId: get("produtoId"),
    status: get("status"),
    q: get("q"),
  };
}