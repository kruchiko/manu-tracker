import { useState, useEffect, useCallback } from "react";
import type { PipelineStep } from "../pipelines.types";
import { calcMaxVisible } from "./pipelineFlowLayout";
import styles from "./PipelineFlowPreview.module.css";

interface PipelineFlowPreviewProps {
  steps: PipelineStep[];
  onMore?: () => void;
}

function formatDuration(seconds: number | null): string {
  if (seconds === null) return "";
  return `max ${Math.round(seconds / 60)} min`;
}

function formatCapacity(cap: number | null): string {
  if (cap === null) return "";
  return `max ${cap}/tray`;
}

export function PipelineFlowPreview({
  steps,
  onMore,
}: PipelineFlowPreviewProps): React.JSX.Element {
  const getMax = useCallback(
    () => calcMaxVisible(window.innerWidth, steps.length),
    [steps.length],
  );

  const [maxVisible, setMaxVisible] = useState(getMax);

  useEffect(() => {
    function onResize(): void {
      setMaxVisible(calcMaxVisible(window.innerWidth, steps.length));
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [steps.length]);

  const truncated = maxVisible < steps.length;
  const visible = truncated ? steps.slice(0, maxVisible) : steps;
  const hiddenCount = steps.length - maxVisible;

  return (
    <div className={styles.row}>
      {visible.map((step, i) => (
        <div key={step.id} className={styles.node}>
          {i > 0 && <div className={styles.connector} />}
          <div className={styles.nodeContent}>
            <div className={styles.dot} />
            <span className={styles.name}>{step.stationName}</span>
            {step.maxDurationSeconds !== null && (
              <span className={styles.detailLine}>{formatDuration(step.maxDurationSeconds)}</span>
            )}
            {step.maxCapacity !== null && (
              <span className={styles.detailLine}>{formatCapacity(step.maxCapacity)}</span>
            )}
          </div>
        </div>
      ))}
      {truncated && (
        <>
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
        </>
      )}
    </div>
  );
}
