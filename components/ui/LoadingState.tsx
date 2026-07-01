type LoadingStateProps = {
  label?: string;
  description?: string;
  compact?: boolean;
  className?: string;
};

export default function LoadingState({
  label = "Chargement en cours…",
  description,
  compact = false,
  className = "",
}: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-center justify-center ${compact ? "min-h-32" : "min-h-56"} ${className}`.trim()}
    >
      <div className="flex max-w-sm flex-col items-center px-5 text-center">
        <span className="relative flex h-11 w-11 items-center justify-center">
          <span className="absolute inset-0 rounded-full border-[3px] border-slate-200" />
          <span className="absolute inset-0 animate-spin rounded-full border-[3px] border-transparent border-t-orange-500 motion-reduce:animate-none motion-reduce:border-orange-500" />
          <span className="h-2 w-2 rounded-full bg-slate-950" />
        </span>
        <p className="mt-4 text-sm font-bold text-slate-800">{label}</p>
        {description && (
          <p className="mt-1.5 text-xs leading-5 text-slate-500">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
