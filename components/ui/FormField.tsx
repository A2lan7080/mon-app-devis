import type { ReactNode } from "react";

type FormFieldProps = {
  label: ReactNode;
  htmlFor?: string;
  hint?: ReactNode;
  error?: ReactNode;
  optional?: boolean;
  children: ReactNode;
  className?: string;
};

export default function FormField({
  label,
  htmlFor,
  hint,
  error,
  optional = false,
  children,
  className = "",
}: FormFieldProps) {
  return (
    <div className={`min-w-0 ${className}`.trim()}>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <label
          htmlFor={htmlFor}
          className="block text-sm font-semibold text-slate-700"
        >
          {label}
        </label>
        {optional && (
          <span className="shrink-0 text-xs font-medium text-slate-400">
            Facultatif
          </span>
        )}
      </div>
      {children}
      {error ? (
        <p className="mt-2 text-xs font-semibold leading-5 text-red-700">
          {error}
        </p>
      ) : (
        hint && (
          <p className="mt-2 text-xs leading-5 text-slate-500">{hint}</p>
        )
      )}
    </div>
  );
}
