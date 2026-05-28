type Props = {
  active: boolean;
  trueLabel?: string;
  falseLabel?: string;
};

export function StatusBadge({
  active,
  trueLabel = "Ativo",
  falseLabel = "Inativo",
}: Props) {
  return (
    <span
      className={
        active
          ? "inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200"
          : "inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-200"
      }
    >
      {active ? trueLabel : falseLabel}
    </span>
  );
}
