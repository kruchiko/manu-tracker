import type { ReactNode } from "react";
import { ScreenHeader } from "./ScreenHeader";
import styles from "./formScreenShared.module.css";

interface FormPageLayoutProps {
  backLabel: string;
  onBack: () => void;
  title: string;
  onCancel: () => void;
  /** Called when the submit button is clicked. Typically `handleSubmit(onSubmit)` from react-hook-form. */
  onSubmit: () => void;
  submitLabel: string;
  isSubmitting?: boolean;
  /** Optional HTML form `id` — when set, the submit button uses `form={formId}` so it works outside the `<form>`. */
  formId?: string;
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
  formId,
  left,
  right,
}: FormPageLayoutProps): React.JSX.Element {
  const submitBtnProps = formId
    ? { type: "submit" as const, form: formId }
    : { type: "button" as const, onClick: onSubmit };

  return (
    <div>
      <ScreenHeader
        layout="inline"
        backLabel={backLabel}
        onBack={onBack}
        title={title}
        actions={
          <>
            <button type="button" onClick={onCancel} className={styles.cancelButton}>
              Cancel
            </button>
            <button
              {...submitBtnProps}
              disabled={isSubmitting}
              className={styles.submitButton}
            >
              {isSubmitting ? "Saving..." : submitLabel}
            </button>
          </>
        }
      />

      <div className={styles.grid}>
        {left}
        {right}
      </div>
    </div>
  );
}
