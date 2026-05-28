type Props = {
  message?: string | null;
  variant?: "success" | "error";
};

export function FormFeedback({ message, variant = "error" }: Props) {
  if (!message) return null;
  return (
    <p
      role={variant === "error" ? "alert" : "status"}
      className={
        variant === "error"
          ? "rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700"
          : "rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800"
      }
    >
      {message}
    </p>
  );
}
