/**
 * Helpers compartilhados pelas Server Actions de cadastros.
 */

export function getString(
  formData: FormData,
  key: string,
  opts: { required?: boolean; trim?: boolean } = {},
): string {
  const raw = formData.get(key);
  const value = typeof raw === "string" ? (opts.trim !== false ? raw.trim() : raw) : "";
  if (opts.required && !value) {
    throw new Error(`Campo "${key}" é obrigatório.`);
  }
  return value;
}

export function getOptionalString(formData: FormData, key: string): string | null {
  const v = getString(formData, key);
  return v ? v : null;
}

export function getInteger(
  formData: FormData,
  key: string,
  opts: { required?: boolean; min?: number; max?: number } = {},
): number | null {
  const raw = formData.get(key);
  const str = typeof raw === "string" ? raw.trim() : "";
  if (!str) {
    if (opts.required) throw new Error(`Campo "${key}" é obrigatório.`);
    return null;
  }
  const n = Number(str);
  if (!Number.isInteger(n)) throw new Error(`Campo "${key}" deve ser um inteiro.`);
  if (opts.min !== undefined && n < opts.min)
    throw new Error(`Campo "${key}" deve ser >= ${opts.min}.`);
  if (opts.max !== undefined && n > opts.max)
    throw new Error(`Campo "${key}" deve ser <= ${opts.max}.`);
  return n;
}

export function buildQuery(params: Record<string, string | undefined>): string {
  const search = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v) search.set(k, v);
  }
  const s = search.toString();
  return s ? `?${s}` : "";
}

export function shortError(e: unknown): string {
  if (e instanceof Error) return e.message;
  return "Erro inesperado.";
}
