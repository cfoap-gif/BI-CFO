/**
 * Badge de status de um Boletim Interno (bulletins.status).
 */

const STATUS_CLASSES: { [k: string]: string } = {
  rascunho: "bg-amber-50 text-amber-700 ring-amber-200",
  aprovado: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  cancelado: "bg-gray-100 text-gray-500 ring-gray-200",
};

export function BulletinStatusBadge({ status }: { status: string }) {
  const cls = STATUS_CLASSES[status] ?? STATUS_CLASSES.rascunho;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${cls}`}
    >
      {status}
    </span>
  );
}
