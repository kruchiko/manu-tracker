import { type CSSProperties, useState, useEffect, useRef, useCallback } from "react";
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

function buildGridCols(visibleCount: number, truncated: boolean): string {
  const stepCol = "minmax(0, var(--pipeline-flow-step-width))";
  const gapCol = "var(--space-6)";
  const parts: string[] = [];
  for (let i = 0; i < visibleCount; i++) {
    if (i > 0) parts.push(gapCol);
    parts.push(stepCol);
  }
  if (truncated) {
    parts.push(gapCol);
    parts.push("auto");
  }
  return parts.join(" ");
}

export function PipelineFlowPreview({
  steps,
  onMore,
}: PipelineFlowPreviewProps): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const [maxVisible, setMaxVisible] = useState(steps.length);

  const recalc = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const width = el.getBoundingClientRect().width;
    if (width > 0) setMaxVisible(calcMaxVisible(width, steps.length));
  }, [steps.length]);

  useEffect(() => {
    recalc();
    const ro = new ResizeObserver(recalc);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [recalc]);

  const truncated = maxVisible < steps.length;
  const visible = truncated ? steps.slice(0, maxVisible) : steps;
  const hiddenCount = steps.length - maxVisible;

  const visibleBlocks = visible.map((step) => ({
    step,
    durationText: formatDurationRange(step.minDurationSeconds, step.maxDurationSeconds),
    capacityText: formatCapacityRange(step.minCapacity, step.maxCapacity),
  }));

  const totalCols = visible.length + (visible.length - 1) + (truncated ? 2 : 0);
  const gridStyle: CSSProperties = {
    gridTemplateColumns: buildGridCols(visible.length, truncated),
    gridTemplateRows: "var(--pipeline-step-node-size) auto",
  };

  return (
    <div ref={containerRef} className={styles.flowContainer} data-testid="pipeline-flow-root">
      <div
        className={styles.flow}
        style={gridStyle}
        role="group"
        aria-label={`Pipeline flow, ${steps.length} step${steps.length !== 1 ? "s" : ""}`}
      >
        {/* ── Row 1: dots + connectors ── */}
        {visibleBlocks.map(({ step }, i) => {
          const col = i * 2 + 1;
          return (
            <div
              key={`dot-${step.id}`}
              className={styles.stepDotCell}
              style={{ gridColumn: col, gridRow: 1 }}
            >
              <div className={styles.dot} aria-hidden />
            </div>
          );
        })}
        {visibleBlocks.map(({ step }, i) => {
          if (i === 0) return null;
          const col = i * 2;
          return (
            <div
              key={`conn-${step.id}`}
              className={styles.connectorCell}
              style={{ gridColumn: col, gridRow: 1 }}
              aria-hidden
            >
              <div className={styles.connector} />
            </div>
          );
        })}
        {truncated && (
          <>
            <div
              className={styles.connectorCell}
              style={{ gridColumn: totalCols - 1, gridRow: 1 }}
              aria-hidden
            >
              <div className={styles.connector} />
            </div>
            <div
              className={styles.moreChipCell}
              style={{ gridColumn: totalCols, gridRow: 1 }}
            >
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

        {/* ── Row 2: names + details ── */}
        {visibleBlocks.map(({ step, durationText, capacityText }, i) => {
          const col = i * 2 + 1;
          return (
            <div
              key={`meta-${step.id}`}
              className={styles.stepMetaCell}
              style={{ gridColumn: col, gridRow: 2 }}
            >
              <span className={styles.name}>{step.stationName}</span>
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
          );
        })}
      </div>
    </div>
  );
}
