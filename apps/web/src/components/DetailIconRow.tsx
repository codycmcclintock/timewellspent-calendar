import type { LucideIcon } from "lucide-react";

export function DetailIconRow({
  icon: Icon,
  label,
  value,
  children,
}: {
  icon: LucideIcon;
  label: string;
  value?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex gap-3 border-b border-black/5 py-3 last:border-0">
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-muted" strokeWidth={1.5} />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">
          {label}
        </p>
        {children ?? (
          <p className="mt-0.5 text-sm text-ink">{value || "—"}</p>
        )}
      </div>
    </div>
  );
}
