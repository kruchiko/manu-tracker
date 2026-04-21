import { useState, useEffect } from "react";
import type { PipelineStep } from "../pipelines.types";
import { calcMaxVisible } from "./pipelineFlowLayout";
import styles from "./PipelineFlowPreview.module.css";

interface PipelineFlowPreviewProps {
  steps: PipelineStep[];
  onMore?: () => void;
}

function formatDurationRange(minSeconds: number | null, maxSeconds: number | null): string | null {
  if (minSeconds !== null && maxSeconds !== null) {
    return `${Math.round(minSeconds / 60)}–${Math.round(maxSeconds / 60)} min`;
  }
  if (maxSeconds !== null) {
    return `max ${Math.round(maxSeconds / 60)} min`;
  }
  if (minSeconds !== null) {
    return `min ${Math.round(minSeconds / 60)} min`;
  }
  return null;
}

function formatCapacityRange(minCap: number | null, maxCap: number | null): string | null {
  if (minCap !== null && maxCap !== null) {
    return `${minCap}–${maxCap}/tray`;
  }
  if (maxCap !== null) {
    return `max ${maxCap}/tray`;
  }
  if (minCap !== null) {
    return `min ${minCap}/tray`;
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
          <div key={step.id} className={styles.node}>
            <div className={styles.rail}>
              {i > 0 && <div className={styles.connector} />}
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
        );
      })}
      {truncated && (
        <div className={styles.moreTail}>
          <div className={styles.connector} />
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
