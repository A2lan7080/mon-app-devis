import type { HTMLAttributes, ReactNode } from "react";

export type CardVariant =
  | "default"
  | "soft"
  | "accent"
  | "info"
  | "success";

export type CardPadding = "none" | "sm" | "md" | "lg";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  variant?: CardVariant;
  padding?: CardPadding;
  children: ReactNode;
};

const variantClasses: Record<CardVariant, string> = {
  default: "border-slate-200 bg-white shadow-sm",
  soft: "border-slate-200 bg-slate-50",
  accent: "border-orange-200 bg-orange-50/60",
  info: "border-sky-200 bg-gradient-to-br from-white to-sky-50 shadow-sm",
  success: "border-emerald-200 bg-emerald-50/60",
};

const paddingClasses: Record<CardPadding, string> = {
  none: "",
  sm: "p-4",
  md: "p-4 sm:p-5",
  lg: "p-5 sm:p-6",
};

export default function Card({
  variant = "default",
  padding = "md",
  className = "",
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={[
        "rounded-2xl border",
        variantClasses[variant],
        paddingClasses[padding],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}
