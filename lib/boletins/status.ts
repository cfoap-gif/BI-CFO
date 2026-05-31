/**
 * Estados e regras de transição de Boletins Internos (M5).
 *
 * Ciclo:
 *   rascunho → aprovado    (approveBulletin)
 *   aprovado → rascunho    (reopenBulletin — reabertura controlada)
 *   rascunho|aprovado → cancelado (cancelBulletin)
 */

export type BulletinStatus = "rascunho" | "aprovado" | "cancelado";

/** Deriva o tipo do BI a partir do período. */
export function bulletinType(startDate: string, endDate: string): "diário" | "período" {
  return startDate === endDate ? "diário" : "período";
}

/** event_type gravado em bulletin_events para cada transição-alvo. */
export const BULLETIN_EVENT_BY_TARGET: { [to: string]: string } = {
  aprovado: "aprovado",
  rascunho: "reaberto",
  cancelado: "cancelado",
};

/**
 * Verifica se uma transição de status é permitida.
 * Lança Error com mensagem clara se não for.
 */
export function assertBulletinTransition(from: string, to: BulletinStatus): void {
  const allowed: { [from: string]: BulletinStatus[] } = {
    rascunho: ["aprovado", "cancelado"],
    aprovado: ["rascunho", "cancelado"],
  };
  const targets = allowed[from] ?? [];
  if (!targets.includes(to)) {
    throw new Error(
      `Transição inválida: "${from}" → "${to}". A partir de "${from}" ` +
        `só é permitido: ${targets.length ? targets.join(", ") : "(nenhuma ação)"}.`,
    );
  }
}
