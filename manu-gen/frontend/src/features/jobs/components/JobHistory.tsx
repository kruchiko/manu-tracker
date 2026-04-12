import { useMemo, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { useJobHistory } from "../hooks/useJobHistory";
import type { JobHistoryEntry, JobHistoryPhase, JobTimelineContext } from "../jobs.types";
import { formatDuration, parseUtc } from "../utils/duration";
import { buildStationColorIndexMap } from "../utils/stationColorIndex";
import styles from "./JobHistory.module.css";

interface JobHistoryProps {
  job: JobTimelineContext;
  onClose?: () => void;
  embedded?: boolean;
}

function formatTime(iso: string): string {
  const date = parseUtc(iso);
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function entryTitle(entry: JobHistoryEntry): string {
  switch (entry.phase) {
    case "arrived":
      return `Arrived — ${entry.station}`;
    case "departed":
      return `Left — ${entry.station}`;
    default:
      return entry.station;
  }
}

function showCurrentlyHere(entry: JobHistoryEntry, isLast: boolean): boolean {
  if (!isLast || entry.durationSeconds !== null) return false;
  return entry.phase === "arrived" || entry.phase === "scan";
}

function dotClass(i: number): string {
  const k = i % 4;
  if (k === 1) return `${styles.dot} ${styles.dot1}`;
  if (k === 2) return `${styles.dot} ${styles.dot2}`;
  if (k === 3) return `${styles.dot} ${styles.dot3}`;
  return styles.dot;
}

function barClass(i: number, scan: boolean): string {
  const k = i % 4;
  const base = k === 1 ? styles.bar1 : k === 2 ? styles.bar2 : k === 3 ? styles.bar3 : styles.bar0;
  return `${styles.bar} ${base}${scan ? ` ${styles.barScan}` : ""}`;
}

export function JobHistory({ job, onClose, embedded }: JobHistoryProps) {
  const { data, isLoading, error } = useJobHistory(job.id);
  const scrollRef = useRef<HTMLDivElement>(null);

  const colorMap = useMemo(
    () => buildStationColorIndexMap((data ?? []).map((e) => e.station)),
    [data],
  );

  const maxDuration = useMemo(
    () => Math.max(1, ...(data ?? []).map((e) => e.durationSeconds ?? 0)),
    [data],
  );

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [data]);

  const timeline = (
    <>
      {isLoading && <p className={styles.loading}>Loading history…</p>}

      {error && (
        <p className={styles.error}>Failed to load history: {error.message}</p>
      )}

      {data && data.length === 0 && (
        <p className={styles.empty}>No tracking events recorded for this job yet.</p>
      )}

      {data && data.length > 0 && (
        <div
          ref={scrollRef}
          className={`${styles.timelineScroll} ${embedded ? styles.timelineScrollEmbedded : ""}`}
        >
          {data.map((entry, index) => {
            const isLast = index === data.length - 1;
            const phaseLabel: Record<JobHistoryPhase, string> = {
              arrived: "Arrived",
              departed: "Left",
              scan: "Scan",
            };
            const colorIdx = colorMap.get(entry.station) ?? 0;
            const hasDuration = entry.durationSeconds !== null && entry.durationSeconds > 0;
            const barWidthPercent = hasDuration
              ? Math.max(4, (entry.durationSeconds! / maxDuration) * 100)
              : 0;

            return (
              <div key={entry.id} className={styles.row}>
                {!isLast && <div className={styles.line} aria-hidden />}
                <div className={dotClass(colorIdx)} aria-hidden />
                <div>
                  <p className={styles.phaseLabel}>{phaseLabel[entry.phase]}</p>
                  <p className={styles.entryTitle}>{entryTitle(entry)}</p>
                  <p className={styles.timeStamp}>{formatTime(entry.at)}</p>

                  {entry.phase === "departed" && entry.durationSeconds !== null && (
                    <div className={styles.barTrack}>
                      <div
                        className={barClass(colorIdx, false)}
                        style={{ width: `${barWidthPercent}%` }}
                      />
                      <span className={styles.durationText}>
                        {formatDuration(entry.durationSeconds)}
                      </span>
                    </div>
                  )}
                  {entry.phase === "scan" && entry.durationSeconds !== null && (
                    <div className={styles.barTrack}>
                      <div
                        className={barClass(colorIdx, true)}
                        style={{ width: `${barWidthPercent}%` }}
                      />
                      <span className={styles.durationText}>
                        {formatDuration(entry.durationSeconds)}
                      </span>
                    </div>
                  )}
                  {showCurrentlyHere(entry, isLast) && (
                    <p className={styles.hereLabel}>Currently at station</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );

  if (embedded) {
    return timeline;
  }

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <div>
          <h3 className={styles.panelTitle}>
            {job.jobNumber} — {job.productType}
          </h3>
          <p className={styles.panelSubtitle}>{job.trayCode}</p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className={styles.closeButton}
            aria-label="Close job history"
          >
            <X size={20} strokeWidth={2} aria-hidden />
          </button>
        )}
      </div>
      {timeline}
    </div>
  );
}
