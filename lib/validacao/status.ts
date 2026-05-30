/**
 * Regras de transição de status para a Validação da Coordenação (M4).
 *
 * Ciclo coberto nesta fase:
 *   enviado            → em revisão            (markInReview)
 *   em revisão         → validado             (validateRecord)
 *   em revisão         → pendente de correção (returnForCorrection)
 *
 * Cada transição gera uma linha em public.record_events com um event_type.
 */

export type RecordStatus =
  | "rascunho"
  | "enviado"
  | "em revisão"
  | "pendente de correção"
  | "validado"
  | "incluído no BI"
  | "interno"
  | "restrito"
  | "cancelado"
  | "arquivado";

/** Estados que aparecem na fila de validação por padrão (pendentes de ação da Coord). */
export const QUEUE_STATUSES: RecordStatus[] = [
  "enviado",
  "em revisão",
  "pendente de correção",
];

/** Todos os estados, para o filtro de status da fila. */
export const ALL_STATUSES: RecordStatus[] = [
  "rascunho",
  "enviado",
  "em revisão",
  "pendente de correção",
  "validado",
  "incluído no BI",
  "interno",
  "restrito",
  "cancelado",
  "arquivado",
];

/** event_type gravado em record_events para cada transição-alvo. */
export const EVENT_TYPE_BY_TARGET: { [to: string]: string } = {
  "em revisão": "em_revisao",
  validado: "validado",
  "pendente de correção": "devolvido",
};

/**
 * Verifica se uma transição é permitida no fluxo de validação.
 * Lança Error com mensagem clara se não for.
 */
export function assertTransition(from: string, to: RecordStatus): void {
  const allowed: { [from: string]: RecordStatus[] } = {
    enviado: ["em revisão"],
    "em revisão": ["validado", "pendente de correção"],
  };
  const targets = allowed[from] ?? [];
  if (!targets.includes(to)) {
    throw new Error(
      `Transição inválida: "${from}" → "${to}". A partir de "${from}" ` +
        `só é permitido: ${targets.length ? targets.join(", ") : "(nenhuma ação)"}.`,
    );
  }
}
