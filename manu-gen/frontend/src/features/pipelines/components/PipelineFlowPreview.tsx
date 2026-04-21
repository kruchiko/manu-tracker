import { Fragment, useState, useEffect } from "react";
import type { PipelineStep } from "../pipelines.types";
import { calcMaxVisible } from "./pipelineFlowLayout";
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

  return (
    <div className={styles.row}>
      {visible.map((step, i) => {
        const durationText = formatDurationRange(
          step.minDurationSeconds,
          step.maxDurationSeconds,
        );
        const capacityText = formatCapacityRange(step.minCapacity, step.maxCapacity);
        return (
          <Fragment key={step.id}>
            {i > 0 && (
              <div className={styles.connectorWrap} aria-hidden>
                <div className={styles.connector} />
              </div>
            )}
            <div className={styles.node}>
              <div className={styles.rail}>
                <div className={styles.dot} aria-hidden />
              </div>
              <span className={styles.name}>{step.stationName}</span>
              <div className={styles.detailSlot}>
                {durationText !== null && (
                  <span className={styles.detailLine}>{durationText}</span>
                )}
                {capacityText !== null && (
                  <span className={styles.detailLine}>{capacityText}</span>
                )}
              </div>
            </div>
          </Fragment>
        );
      })}
      {truncated && (
        <div className={styles.tailGroup}>
          <div className={styles.connector} aria-hidden />
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
      )}
    </div>
  );
}
