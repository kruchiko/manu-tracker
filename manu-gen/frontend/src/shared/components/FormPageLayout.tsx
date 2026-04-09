import type { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";

interface FormPageLayoutProps {
  backLabel: string;
  onBack: () => void;
  title: string;
  onCancel: () => void;
  onSubmit: () => void;
  submitLabel: string;
  isSubmitting?: boolean;
  left: ReactNode;
  right: ReactNode;
}

export function FormPageLayout({
  backLabel,
  onBack,
  title,
  onCancel,
  onSubmit,
  submitLabel,
  isSubmitting = false,
  left,
  right,
}: FormPageLayoutProps): React.JSX.Element {
  return (
    <div>
      <div className="flex items-center border-b border-border pb-[22px] mb-[28px]">
        <button
          type="button"
          onClick={onBack}
          className="mr-[16px] flex shrink-0 items-center gap-[6px] text-[13px] text-text-muted transition-colors duration-[var(--duration-fast)] hover:text-accent"
        >
          <ChevronLeft size={14} strokeWidth={1.5} />
          {backLabel}
        </button>
        <h1 className="flex-1 font-heading text-[22px] font-bold text-text">
          {title}
        </h1>
        <div className="flex gap-[var(--space-2)]">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex h-[32px] items-center rounded-[var(--radius-md)] border border-border-strong bg-surface px-[14px] font-body text-[13px] font-medium text-text-secondary transition-colors duration-[var(--duration-fast)] hover:border-text hover:text-text"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting}
            className="inline-flex h-[32px] items-center rounded-[var(--radius-md)] border border-accent bg-accent px-[14px] font-body text-[13px] font-medium text-white transition-colors duration-[var(--duration-fast)] hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Saving..." : submitLabel}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-[28px] lg:grid-cols-[280px_1fr]">
        {left}
        {right}
      </div>
    </div>
  );
}
