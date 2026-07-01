import type { ReactNode } from "react";

type EmptyStateProps = {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
};

export default function EmptyState({
  title,
  description,
  icon,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={[
        "rounded-2xl border border-dashed border-slate-300 bg-gradient-to-b from-white to-slate-50 px-4 py-8 text-center",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {icon && (
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-xl text-orange-700">
          {icon}
        </div>
      )}
      <p className="text-sm font-bold text-slate-800">{title}</p>
      {description && (
        <p className="mx-auto mt-1.5 max-w-md text-xs leading-5 text-slate-500">
          {description}
        </p>
      )}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}
