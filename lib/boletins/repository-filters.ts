export type RepositoryFilterInput = {
  year?: string;
  number?: string;
  q?: string;
  start?: string;
  end?: string;
};

export type RepositoryFilters = {
  year?: number;
  number?: number;
  q?: string;
  start?: string;
  end?: string;
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function parseInteger(value: string | undefined, min: number, max: number): number | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  if (!Number.isInteger(parsed)) return undefined;
  if (parsed < min || parsed > max) return undefined;
  return parsed;
}

function parseDate(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed || !DATE_RE.test(trimmed)) return undefined;
  return trimmed;
}

function parseSearch(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed || trimmed.length < 2) return undefined;
  return trimmed.slice(0, 120);
}

export function normalizeRepositoryFilters(input: RepositoryFilterInput): RepositoryFilters {
  const filters: RepositoryFilters = {};
  const year = parseInteger(input.year, 2000, 2099);
  const number = parseInteger(input.number, 1, 99999);
  const q = parseSearch(input.q);
  const start = parseDate(input.start);
  const end = parseDate(input.end);

  if (year !== undefined) filters.year = year;
  if (number !== undefined) filters.number = number;
  if (q) filters.q = q;
  if (start) filters.start = start;
  if (end) filters.end = end;

  return filters;
}
