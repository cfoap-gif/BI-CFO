"use client";

import { useFormStatus } from "react-dom";

type Variant = "primary" | "secondary" | "danger";

type Props = {
  children: React.ReactNode;
  pendingLabel?: string;
  variant?: Variant;
};

const BASE =
  "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium shadow-sm transition focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

const STYLES: Record<Variant, string> = {
  primary:
    "bg-slate-900 text-white hover:bg-slate-800 focus:ring-slate-900/40",
  secondary:
    "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 focus:ring-slate-900/30",
  danger:
    "border border-red-300 bg-white text-red-700 hover:bg-red-50 focus:ring-red-500/40",
};

export function SubmitButton({
  children,
  pendingLabel,
  variant = "primary",
}: Props) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`${BASE} ${STYLES[variant]}`}
    >
      {pending ? (
        <>
          <svg
            className="mr-2 h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
          {pendingLabel ?? "Salvando..."}
        </>
      ) : (
        children
      )}
    </button>
  );
}
