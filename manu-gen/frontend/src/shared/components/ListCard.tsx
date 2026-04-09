import type { ReactNode } from "react";

interface ListCardProps {
  title: string;
  count: number;
  countLabel: string;
  children: ReactNode;
}

export function ListCard({ title, count, countLabel, children }: ListCardProps): React.JSX.Element {
  return (
    <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface shadow-sm">
      <div className="flex items-center justify-between border-b border-border px-[24px] py-[14px]">
        <span className="text-[length:var(--text-base)] font-semibold text-text">{title}</span>
        <span className="font-mono text-[10px] tracking-[0.08em] text-text-muted">
          {count} {countLabel}
        </span>
      </div>
      {children}
    </div>
  );
}
