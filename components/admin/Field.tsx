/**
 * Componentes de campo de formulário do BI-CFO.
 *
 * Padrão visual:
 *  - Borda forte (slate-300) com hover/foco mais escuro.
 *  - Texto digitado em slate-900 (contraste AAA contra fundo branco).
 *  - Placeholder em slate-400 — visivelmente diferente do texto preenchido.
 *  - Ring de foco visível (a11y) — slate-900/20.
 *  - Estados disabled claramente sinalizados (slate-50 + opacidade).
 *
 * Mudança no campo central evita refactor por página.
 */

const INPUT_BASE =
  "mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 hover:border-slate-400 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500";

const LABEL =
  "block text-sm font-medium text-slate-700";

const HINT = "mt-1 text-xs text-slate-500";

type BaseProps = {
  label: string;
  name: string;
  required?: boolean;
  defaultValue?: string | number;
  placeholder?: string;
  hint?: string;
  className?: string;
};

type TextFieldProps = BaseProps & {
  type?: "text" | "tel" | "number" | "email" | "password";
  min?: number;
  max?: number;
  autoComplete?: string;
};

export function TextField({
  label,
  name,
  required,
  defaultValue,
  placeholder,
  hint,
  className,
  type = "text",
  min,
  max,
  autoComplete,
}: TextFieldProps) {
  return (
    <div className={className}>
      <label htmlFor={name} className={LABEL}>
        {label}
        {required && (
          <span className="ml-0.5 text-red-600" aria-hidden="true">
            *
          </span>
        )}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        placeholder={placeholder}
        min={min}
        max={max}
        autoComplete={autoComplete}
        className={INPUT_BASE}
      />
      {hint && <p className={HINT}>{hint}</p>}
    </div>
  );
}

type SelectFieldProps = BaseProps & {
  options: { value: string; label: string }[];
};

export function SelectField({
  label,
  name,
  required,
  defaultValue,
  hint,
  className,
  options,
}: SelectFieldProps) {
  return (
    <div className={className}>
      <label htmlFor={name} className={LABEL}>
        {label}
        {required && (
          <span className="ml-0.5 text-red-600" aria-hidden="true">
            *
          </span>
        )}
      </label>
      <select
        id={name}
        name={name}
        required={required}
        defaultValue={defaultValue}
        className={INPUT_BASE}
      >
        <option value="">— selecione —</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {hint && <p className={HINT}>{hint}</p>}
    </div>
  );
}

type TextAreaFieldProps = BaseProps & {
  rows?: number;
};

export function TextAreaField({
  label,
  name,
  required,
  defaultValue,
  placeholder,
  hint,
  className,
  rows = 3,
}: TextAreaFieldProps) {
  return (
    <div className={className}>
      <label htmlFor={name} className={LABEL}>
        {label}
        {required && (
          <span className="ml-0.5 text-red-600" aria-hidden="true">
            *
          </span>
        )}
      </label>
      <textarea
        id={name}
        name={name}
        required={required}
        defaultValue={defaultValue}
        placeholder={placeholder}
        rows={rows}
        className={`${INPUT_BASE} leading-relaxed`}
      />
      {hint && <p className={HINT}>{hint}</p>}
    </div>
  );
}
