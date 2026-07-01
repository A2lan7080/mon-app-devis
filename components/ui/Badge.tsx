import type { HTMLAttributes, ReactNode } from "react";

export type BadgeTone =
  | "neutral"
  | "info"
  | "success"
  | "warning"
  | "danger";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
  status?: string;
  dot?: boolean;
  children: ReactNode;
};

const toneClasses: Record<BadgeTone, string> = {
  neutral: "bg-slate-100 text-slate-700 ring-slate-900/5",
  info: "bg-sky-100 text-sky-800 ring-sky-700/10",
  success: "bg-emerald-100 text-emerald-800 ring-emerald-700/10",
  warning: "bg-orange-100 text-orange-800 ring-orange-700/10",
  danger: "bg-red-100 text-red-700 ring-red-700/10",
};

const dotClasses: Record<BadgeTone, string> = {
  neutral: "bg-slate-500",
  info: "bg-sky-600",
  success: "bg-emerald-600",
  warning: "bg-orange-500",
  danger: "bg-red-600",
};

function getStatusTone(status?: string): BadgeTone {
  const normalizedStatus = status?.trim().toLocaleLowerCase("fr") ?? "";

  if (
    normalizedStatus === "accepté" ||
    normalizedStatus === "payée" ||
    normalizedStatus === "terminé"
  ) {
    return "success";
  }

  if (
    normalizedStatus === "refusé" ||
    normalizedStatus === "en retard" ||
    normalizedStatus === "suspendu"
  ) {
    return "danger";
  }

  if (
    normalizedStatus === "envoyé" ||
    normalizedStatus === "envoyée" ||
    normalizedStatus === "en cours" ||
    normalizedStatus === "planifié"
  ) {
    return "info";
  }

  if (normalizedStatus === "à planifier") {
    return "warning";
  }

  return "neutral";
}

export default function Badge({
  tone,
  status,
  dot = false,
  className = "",
  children,
  ...props
}: BadgeProps) {
  const resolvedTone = tone ?? getStatusTone(status);

  return (
    <span
      className={[
        "inline-flex max-w-full items-center justify-center gap-1.5 rounded-full px-2.5 py-1 text-[0.6875rem] font-bold leading-4 ring-1 ring-inset",
        toneClasses[resolvedTone],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {dot && (
        <span
          aria-hidden="true"
          className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotClasses[resolvedTone]}`}
        />
      )}
      {children}
    </span>
  );
}
