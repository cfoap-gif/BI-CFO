"use client";

import { useFormStatus } from "react-dom";

type Props = {
  children: React.ReactNode;
  pendingLabel?: string;
  variant?: "primary" | "secondary" | "danger";
};

const STYLES: Record<NonNullable<Props["variant"]>, string> = {
  primary:
    "rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800 disabled:opacity-50",
  secondary:
    "rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50",
  danger:
    "rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-50",
};

export function SubmitButton({
  children,
  pendingLabel,
  variant = "primary",
}: Props) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={STYLES[variant]}>
      {pending ? (pendingLabel ?? "Salvando...") : children}
    </button>
  );
}
