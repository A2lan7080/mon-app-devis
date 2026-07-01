import type { HTMLAttributes, ReactNode } from "react";

type FeedbackTone = "success" | "error" | "warning" | "info";

type FeedbackMessageProps = HTMLAttributes<HTMLDivElement> & {
  tone: FeedbackTone;
  title?: ReactNode;
  children: ReactNode;
};

const toneClasses: Record<FeedbackTone, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  error: "border-red-200 bg-red-50 text-red-700",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  info: "border-sky-200 bg-sky-50 text-sky-900",
};

const iconClasses: Record<FeedbackTone, string> = {
  success: "bg-emerald-100 text-emerald-700",
  error: "bg-red-100 text-red-700",
  warning: "bg-amber-100 text-amber-800",
  info: "bg-sky-100 text-sky-700",
};

const icons: Record<FeedbackTone, string> = {
  success: "✓",
  error: "!",
  warning: "!",
  info: "i",
};

export default function FeedbackMessage({
  tone,
  title,
  children,
  className = "",
  ...props
}: FeedbackMessageProps) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm leading-6 ${toneClasses[tone]} ${className}`.trim()}
      {...props}
    >
      <span
        aria-hidden="true"
        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-black ${iconClasses[tone]}`}
      >
        {icons[tone]}
      </span>
      <div className="min-w-0">
        {title && <p className="font-bold">{title}</p>}
        <div className={title ? "mt-0.5" : "font-medium"}>{children}</div>
      </div>
    </div>
  );
}
