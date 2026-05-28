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
          ? "rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-inset ring-red-200"
          : "rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700 ring-1 ring-inset ring-emerald-200"
      }
    >
      {message}
    </p>
  );
}
