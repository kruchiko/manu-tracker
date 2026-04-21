import { Fragment, useState } from "react";
import { X } from "lucide-react";
import styles from "./HintBanner.module.css";

function IlluDot({ variant }: { variant: "accent" | "alert" }): React.JSX.Element {
  return <div className={`${styles.illuDot} ${variant === "alert" ? styles.illuDotAlert : ""}`} />;
}

function IlluLine({ variant }: { variant: "accent" | "alert" }): React.JSX.Element {
  return <div className={`${styles.illuLine} ${variant === "alert" ? styles.illuLineAlert : ""}`} />;
}

function LineSlot({ children }: { children?: React.ReactNode }): React.JSX.Element {
  return <div className={styles.lineSlot}>{children ?? <span className={styles.lineSlotGhost} aria-hidden />}</div>;
}

interface HintLaneProps {
  variant: "accent" | "alert";
  typeBox: React.JSX.Element;
  typeLabel: React.JSX.Element;
  stationCount: number;
  stepCountLabel: string;
}

/** Top row = type + lines + dots only (one centerline); bottom row = same column widths for labels. */
function HintLane({ variant, typeBox, typeLabel, stationCount, stepCountLabel }: HintLaneProps): React.JSX.Element {
  const nodes = Array.from({ length: stationCount }, (_, i) => i + 1);

  return (
    <div className={styles.illuLane}>
      <div className={styles.illuLaneRail}>
        <div className={styles.railColType}>{typeBox}</div>
        <LineSlot>
          <IlluLine variant={variant} />
        </LineSlot>
        {nodes.map((n, i) => (
          <Fragment key={`rail-${n}`}>
            <div className={styles.nodeSlot}>
              <IlluDot variant={variant} />
            </div>
            {i < stationCount - 1 ? (
              <LineSlot>
                <IlluLine variant={variant} />
              </LineSlot>
            ) : null}
          </Fragment>
        ))}
        <div className={styles.railStepCountSlot}>
          <span
            className={`${styles.illuStepCount} ${variant === "alert" ? styles.illuStepCountAlert : ""}`}
          >
            {stepCountLabel}
          </span>
        </div>
      </div>

      <div className={styles.illuLaneLabels}>
        <div className={styles.railColType}>{typeLabel}</div>
        <LineSlot />
        {nodes.map((n, i) => (
          <Fragment key={`lab-${n}`}>
            <div className={styles.labelSlot}>
              <span
                className={`${styles.illuDotLabel} ${variant === "alert" ? styles.illuDotLabelAlert : ""}`}
              >
                S{n}
              </span>
            </div>
            {i < stationCount - 1 ? <LineSlot /> : null}
          </Fragment>
        ))}
        <div className={styles.railStepCountSlot} aria-hidden />
      </div>
    </div>
  );
}

export function HintBanner(): React.JSX.Element | null {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div className={styles.banner}>
      <div className={styles.bannerMain}>
        <div className={styles.illustration}>
          <div className={styles.illuRow}>
            <HintLane
              variant="accent"
              typeBox={
                <div className={styles.typeBox}>
                  <svg width="14" height="12" viewBox="0 0 14 12" fill="none" stroke="var(--accent)" strokeWidth="1.5">
                    <ellipse cx="7" cy="6" rx="5" ry="4" />
                  </svg>
                </div>
              }
              typeLabel={<span className={styles.typeLabel}>Type A</span>}
              stationCount={3}
              stepCountLabel="3 steps"
            />
          </div>

          <div className={styles.illuRow}>
            <HintLane
              variant="alert"
              typeBox={
                <div className={`${styles.typeBox} ${styles.typeBoxAlert}`}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="var(--alert)" strokeWidth="1.5">
                    <rect x="2" y="2" width="8" height="8" rx="1" />
                  </svg>
                </div>
              }
              typeLabel={<span className={`${styles.typeLabel} ${styles.typeLabelAlert}`}>Type B</span>}
              stationCount={5}
              stepCountLabel="5 steps"
            />
          </div>
        </div>

        <div className={styles.bannerDivider} aria-hidden />

        <div className={styles.textCol}>
          <div className={styles.textTitle}>One pipeline per product type</div>
          <div className={styles.textBody}>
            Each product type follows its own sequence of stations. Type A (3 steps) and Type B (5 steps) move through completely different routes — or can share some stations. For each step you set how long the tray should spend there (min/max), and how many items fit on a tray.
          </div>
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
