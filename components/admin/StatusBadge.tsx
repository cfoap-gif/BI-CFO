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
          ? "inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800 ring-1 ring-inset ring-emerald-200"
          : "inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 ring-1 ring-inset ring-slate-300"
      }
    >
      <span
        className={
          active
            ? "mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-emerald-500"
            : "mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-slate-400"
        }
        aria-hidden="true"
      />
      {active ? trueLabel : falseLabel}
    </span>
  );
}
