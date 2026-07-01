import type { ReactNode } from "react";

type SectionHeaderProps = {
  title: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  actions?: ReactNode;
  headingLevel?: 2 | 3 | 4;
  className?: string;
};

export default function SectionHeader({
  title,
  description,
  eyebrow,
  actions,
  headingLevel = 2,
  className = "",
}: SectionHeaderProps) {
  const Heading = `h${headingLevel}` as const;

  return (
    <div
      className={[
        "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-orange-600">
            {eyebrow}
          </p>
        )}
        <Heading className="text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
          {title}
        </Heading>
        {description && (
          <p className="mt-1.5 text-sm leading-6 text-slate-600">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}
