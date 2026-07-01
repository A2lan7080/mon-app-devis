import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant =
  | "primary"
  | "accent"
  | "secondary"
  | "soft"
  | "warning"
  | "success"
  | "danger";

export type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  loadingLabel?: string;
  children: ReactNode;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-slate-950 text-white shadow-sm hover:bg-slate-800 focus-visible:ring-slate-500",
  accent:
    "bg-orange-500 text-white shadow-[0_10px_24px_rgba(249,115,22,0.28)] hover:-translate-y-0.5 hover:bg-orange-600 hover:shadow-[0_12px_28px_rgba(249,115,22,0.32)] active:translate-y-0 focus-visible:ring-orange-400",
  secondary:
    "border border-slate-200 bg-white text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-slate-400",
  soft:
    "border border-sky-200 bg-sky-50 text-sky-800 hover:bg-sky-100 focus-visible:ring-sky-400",
  warning:
    "border border-amber-200 bg-amber-50 text-amber-900 hover:border-amber-300 hover:bg-amber-100 focus-visible:ring-amber-400",
  success:
    "bg-emerald-700 text-white shadow-sm hover:-translate-y-0.5 hover:bg-emerald-800 hover:shadow-md active:translate-y-0 focus-visible:ring-emerald-600",
  danger:
    "bg-red-700 text-white shadow-sm hover:bg-red-800 focus-visible:ring-red-600",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "min-h-10 px-3.5 py-2 text-xs",
  md: "min-h-11 px-4 py-2.5 text-sm",
  lg: "min-h-12 px-6 py-3 text-base",
};

export default function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  loading = false,
  loadingLabel = "Chargement…",
  disabled,
  className = "",
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={[
        "inline-flex items-center justify-center gap-2 rounded-xl font-bold leading-5 transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:transform-none disabled:cursor-not-allowed disabled:opacity-60",
        variantClasses[variant],
        sizeClasses[size],
        fullWidth ? "w-full" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {loading ? loadingLabel : children}
    </button>
  );
}
