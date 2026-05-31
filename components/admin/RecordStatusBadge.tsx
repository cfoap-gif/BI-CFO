/**
 * Badge de status de um registro (records.status).
 * Cobre todo o ciclo documental. Usado em Livro de Dia e Validação.
 */

const STATUS_CLASSES: { [k: string]: string } = {
  rascunho: "bg-gray-100 text-gray-700 ring-gray-200",
  enviado: "bg-blue-50 text-blue-700 ring-blue-200",
  "em revisão": "bg-amber-50 text-amber-700 ring-amber-200",
  "pendente de correção": "bg-orange-50 text-orange-700 ring-orange-200",
  validado: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  "incluído no BI": "bg-emerald-100 text-emerald-800 ring-emerald-300",
  interno: "bg-purple-50 text-purple-700 ring-purple-200",
  restrito: "bg-red-50 text-red-700 ring-red-200",
  cancelado: "bg-gray-100 text-gray-500 ring-gray-200",
  arquivado: "bg-gray-100 text-gray-500 ring-gray-200",
};

export function RecordStatusBadge({ status }: { status: string }) {
  const cls = STATUS_CLASSES[status] ?? STATUS_CLASSES.rascunho;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${cls}`}
    >
      {status}
    </span>
  );
}
