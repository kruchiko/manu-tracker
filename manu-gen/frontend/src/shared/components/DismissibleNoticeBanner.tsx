import { X } from "lucide-react";
import styles from "./DismissibleNoticeBanner.module.css";

export type DismissibleNoticeVariant = "alert" | "success";

export interface DismissibleNoticeBannerProps {
  message: string;
  onDismiss: () => void;
  /** `alert`: `role="alert"` for errors. `success`: `role="status"` with polite live region. */
  variant?: DismissibleNoticeVariant;
  /** Accessible label for the dismiss control (default: Dismiss notification). */
  dismissAriaLabel?: string;
  className?: string;
}

export function DismissibleNoticeBanner({
  message,
  onDismiss,
  variant = "alert",
  dismissAriaLabel = "Dismiss notification",
  className,
}: DismissibleNoticeBannerProps): React.JSX.Element {
  const bannerClass =
    variant === "success"
      ? `${styles.banner} ${styles.bannerSuccess}`
      : `${styles.banner} ${styles.bannerAlert}`;
  const messageClass =
    variant === "success" ? `${styles.message} ${styles.messageSuccess}` : `${styles.message} ${styles.messageAlert}`;

  return (
    <div
      className={[bannerClass, className].filter(Boolean).join(" ")}
      role={variant === "success" ? "status" : "alert"}
      aria-live={variant === "success" ? "polite" : undefined}
    >
      <p className={messageClass}>{message}</p>
      <button type="button" className={styles.close} aria-label={dismissAriaLabel} onClick={onDismiss}>
        <X size={12} strokeWidth={1.5} aria-hidden />
      </button>
    </div>
  );
}
