import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps): React.JSX.Element {
  return (
    <div className="mb-[24px] flex items-start justify-between">
      <div>
        <h1 className="font-heading text-[length:var(--text-heading)] font-bold leading-[1.1] tracking-[var(--tracking-tight)] text-text">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-[3px] text-[length:var(--text-sm)] text-text-muted">
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}
