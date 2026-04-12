import { useState } from "react";
import { X } from "lucide-react";
import styles from "./HintBanner.module.css";

function IlluDot({ variant }: { variant: "accent" | "alert" }): React.JSX.Element {
  return <div className={`${styles.illuDot} ${variant === "alert" ? styles.illuDotAlert : ""}`} />;
}

function IlluLine({ variant }: { variant: "accent" | "alert" }): React.JSX.Element {
  return <div className={`${styles.illuLine} ${variant === "alert" ? styles.illuLineAlert : ""}`} />;
}

export function HintBanner(): React.JSX.Element | null {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div className={styles.banner}>
      <div className={styles.illustration}>
        {/* Row 1: Type A -> 3 steps */}
        <div className={styles.illuRow}>
          <div className={styles.typeIcon}>
            <div className={styles.typeBox}>
              <svg width="14" height="12" viewBox="0 0 14 12" fill="none" stroke="var(--accent)" strokeWidth="1.5">
                <ellipse cx="7" cy="6" rx="5" ry="4" />
              </svg>
            </div>
            <span className={styles.typeLabel}>Type A</span>
          </div>
          <div className={styles.illuConnector} />
          <div className={styles.illuDots}>
            <div className={styles.illuNode}>
              <IlluDot variant="accent" />
              <span className={styles.illuDotLabel}>S1</span>
            </div>
            <IlluLine variant="accent" />
            <div className={styles.illuNode}>
              <IlluDot variant="accent" />
              <span className={styles.illuDotLabel}>S2</span>
            </div>
            <IlluLine variant="accent" />
            <div className={styles.illuNode}>
              <IlluDot variant="accent" />
              <span className={styles.illuDotLabel}>S3</span>
            </div>
          </div>
          <span className={styles.illuStepCount}>3 steps</span>
        </div>

        {/* Row 2: Type B -> 5 steps */}
        <div className={styles.illuRow}>
          <div className={styles.typeIcon}>
            <div className={`${styles.typeBox} ${styles.typeBoxAlert}`}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="var(--alert)" strokeWidth="1.5">
                <rect x="2" y="2" width="8" height="8" rx="1" />
              </svg>
            </div>
            <span className={`${styles.typeLabel} ${styles.typeLabelAlert}`}>Type B</span>
          </div>
          <div className={`${styles.illuConnector} ${styles.illuConnectorAlert}`} />
          <div className={styles.illuDots}>
            {[1, 2, 3, 4, 5].map((n, i) => (
              <div key={n} className={styles.illuNodeWrap}>
                {i > 0 && <IlluLine variant="alert" />}
                <div className={styles.illuNode}>
                  <IlluDot variant="alert" />
                  <span className={`${styles.illuDotLabel} ${styles.illuDotLabelAlert}`}>S{n}</span>
                </div>
              </div>
            ))}
          </div>
          <span className={`${styles.illuStepCount} ${styles.illuStepCountAlert}`}>5 steps</span>
        </div>
      </div>

      <div className={styles.textCol}>
        <div className={styles.textTitle}>One pipeline per product type</div>
        <div className={styles.textBody}>
          Each product type follows its own sequence of stations. Type A (3 steps) and Type B (5 steps) move through completely different routes — or can share some stations. For each step you set how long the tray should spend there (min/max), and how many items fit on a tray.
        </div>
      </div>

      <button
        type="button"
        onClick={() => setVisible(false)}
        className={styles.closeBtn}
        aria-label="Dismiss hint"
      >
        <X size={12} strokeWidth={1.5} />
      </button>
    </div>
  );
}
