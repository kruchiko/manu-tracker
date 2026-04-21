import { Fragment, useState, useEffect } from "react";
import type { PipelineStep } from "../pipelines.types";
import { buildGridTemplateColumns, calcMaxVisible } from "./pipelineFlowLayout";
import styles from "./PipelineFlowPreview.module.css";

interface PipelineFlowPreviewProps {
  steps: PipelineStep[];
  onMore?: () => void;
}

function formatDurationRange(
  minSeconds: number | null | undefined,
  maxSeconds: number | null | undefined,
): string | null {
  const min = minSeconds ?? null;
  const max = maxSeconds ?? null;
  if (min !== null && max !== null) {
    return `${Math.round(min / 60)}–${Math.round(max / 60)} min`;
  }
  if (max !== null) {
    return `max ${Math.round(max / 60)} min`;
  }
  if (min !== null) {
    return `min ${Math.round(min / 60)} min`;
  }
  return null;
}

function formatCapacityRange(
  minCap: number | null | undefined,
  maxCap: number | null | undefined,
): string | null {
  const min = minCap ?? null;
  const max = maxCap ?? null;
  if (min !== null && max !== null) {
    return `${min}–${max}/tray`;
  }
  if (max !== null) {
    return `max ${max}/tray`;
  }
  if (min !== null) {
    return `min ${min}/tray`;
  }
  return null;
}

/** 1-based CSS grid column for step index `i` (0-based). */
function dotColumn(i: number): number {
  return 2 * i + 1;
}

/** 1-based column for connector before step `i` (i >= 1). */
function connectorBeforeStepColumn(i: number): number {
  return 2 * i;
}

export function PipelineFlowPreview({
  steps,
  onMore,
}: PipelineFlowPreviewProps): React.JSX.Element {
  const [maxVisible, setMaxVisible] = useState(() =>
    calcMaxVisible(window.innerWidth, steps.length),
  );

  useEffect(() => {
    function update(): void {
      setMaxVisible(calcMaxVisible(window.innerWidth, steps.length));
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [steps.length]);

  const truncated = maxVisible < steps.length;
  const visible = truncated ? steps.slice(0, maxVisible) : steps;
  const hiddenCount = steps.length - maxVisible;

  const gridTemplateColumns = buildGridTemplateColumns(visible.length, truncated);

  return (
    <div
      className={styles.flow}
      style={{ gridTemplateColumns }}
      role="group"
      aria-label={`Pipeline flow, ${steps.length} step${steps.length !== 1 ? "s" : ""}`}
    >
      {visible.map((step, i) => {
        const durationText = formatDurationRange(
          step.minDurationSeconds,
          step.maxDurationSeconds,
        );
        const capacityText = formatCapacityRange(step.minCapacity, step.maxCapacity);
        const col = dotColumn(i);
        return (
          <Fragment key={step.id}>
            {i > 0 && (
              <div
                className={styles.connectorCell}
                style={{ gridColumn: connectorBeforeStepColumn(i), gridRow: 1 }}
                aria-hidden
              >
                <div className={styles.connector} />
              </div>
            )}
            <div className={styles.dotCell} style={{ gridColumn: col, gridRow: 1 }}>
              <div className={styles.dot} aria-hidden />
            </div>
            <div className={styles.nameCell} style={{ gridColumn: col, gridRow: 2 }}>
              <span className={styles.name}>{step.stationName}</span>
            </div>
            <div className={styles.detailCell} style={{ gridColumn: col, gridRow: 3 }}>
              <div className={styles.detailSlot}>
                <span
                  className={`${styles.detailLine} ${durationText === null ? styles.detailLinePlaceholder : ""}`}
                  aria-hidden={durationText === null}
                >
                  {durationText ?? "\u00a0"}
                </span>
                <span
                  className={`${styles.detailLine} ${capacityText === null ? styles.detailLinePlaceholder : ""}`}
                  aria-hidden={capacityText === null}
                >
                  {capacityText ?? "\u00a0"}
                </span>
              </div>
            </div>
          </Fragment>
        );
      })}
      {truncated && (
        <>
          <div
            className={styles.connectorCell}
            style={{ gridColumn: 2 * visible.length, gridRow: 1 }}
            aria-hidden
          >
            <div className={styles.connector} />
          </div>
          <div className={styles.moreCell} style={{ gridColumn: 2 * visible.length + 1, gridRow: 1 }}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onMore?.();
              }}
              className={styles.moreChip}
              title={`View all ${steps.length} steps`}
            >
              +{hiddenCount} more
            </button>
          </div>
        </>
      )}
    </div>
  );
}
