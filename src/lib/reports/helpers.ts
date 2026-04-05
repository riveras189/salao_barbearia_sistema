export function toNumber(value: unknown): number {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export function sumBy<T>(items: T[], getter: (item: T) => number): number {
  return items.reduce((acc, item) => acc + toNumber(getter(item)), 0);
}

export function formatMoneyBR(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(toNumber(value));
}

export function formatDateBR(value?: string | Date | null): string {
  if (!value) return "";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("pt-BR").format(d);
}

export function parseDateRange(filters: {
  dia?: string;
  de?: string;
  ate?: string;
}) {
  if (filters.dia) {
    const start = new Date(`${filters.dia}T00:00:00`);
    const end = new Date(`${filters.dia}T23:59:59.999`);
    return { start, end };
  }

  const start = filters.de ? new Date(`${filters.de}T00:00:00`) : undefined;
  const end = filters.ate ? new Date(`${filters.ate}T23:59:59.999`) : undefined;

  return { start, end };
}

export function buildCreatedAtWhere(filters: {
  dia?: string;
  de?: string;
  ate?: string;
}) {
  const { start, end } = parseDateRange(filters);

  if (start && end) {
    return { gte: start, lte: end };
  }

  if (start) {
    return { gte: start };
  }

  if (end) {
    return { lte: end };
  }

  return undefined;
}

export function textIncludes(value: unknown, q?: string) {
  if (!q) return true;
  return String(value ?? "").toLowerCase().includes(q.toLowerCase());
}