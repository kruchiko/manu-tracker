import type { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import styles from "./FormPageLayout.module.css";

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
      <div className={styles.header}>
        <button type="button" onClick={onBack} className={styles.backButton}>
          <ChevronLeft size={14} strokeWidth={1.5} />
          {backLabel}
        </button>
        <h1 className={styles.title}>{title}</h1>
        <div className={styles.actions}>
          <button type="button" onClick={onCancel} className={styles.cancelButton}>
            Cancel
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting}
            className={styles.submitButton}
          >
            {isSubmitting ? "Saving..." : submitLabel}
          </button>
        </div>
      </div>

      <div className={styles.grid}>
        {left}
        {right}
      </div>
    </div>
  );
}
