/**
 * Opções de domínio compartilhadas para registros (records).
 * Fonte única de verdade — usada por Livro de Dia e Validação.
 */

/** As 5 partes do Boletim Interno (Modelo §12). */
export const BULLETIN_PARTS: { value: string; label: string }[] = [
  { value: "1", label: "1ª — Legislação/Ensino" },
  { value: "2", label: "2ª — Alteração de Pessoal" },
  { value: "3", label: "3ª — Assuntos Gerais" },
  { value: "4", label: "4ª — Justiça/Disciplina" },
  { value: "5", label: "5ª — Comunicação/Avisos" },
];

/** Classificações possíveis de um registro (records.classification). */
export const CLASSIFICATIONS: { value: string; label: string }[] = [
  { value: "publicável", label: "Publicável (entra no BI)" },
  { value: "interno", label: "Interno (não publica)" },
  { value: "restrito", label: "Restrito (acesso limitado)" },
];

/** Apenas registros publicáveis podem entrar no Boletim Interno (DT-003). */
export function canEnterBulletin(classification: string | null): boolean {
  return classification === "publicável";
}
