import { Plus, ChevronUp, ChevronDown, X } from "lucide-react";
import type { Station } from "../../stations/stations.types";
import type { StepFormValue } from "../pipelines.schema";
import styles from "./PipelineStepEditor.module.css";

interface PipelineStepEditorProps {
  steps: StepFormValue[];
  stations: Station[];
  onChange: (steps: StepFormValue[]) => void;
}

function formatMinutes(seconds: number | null): string {
  if (seconds === null) return "";
  return String(seconds / 60);
}

export function PipelineStepEditor({ steps, stations, onChange }: PipelineStepEditorProps): React.JSX.Element {
  function handleStationChange(index: number, stationId: string): void {
    const next = [...steps];
    next[index] = { ...next[index], stationId };
    onChange(next);
  }

  function handleDurationChange(index: number, raw: string): void {
    const next = [...steps];
    const minutes = raw.trim() === "" ? null : Number(raw);
    next[index] = {
      ...next[index],
      maxDurationSeconds: minutes !== null && !isNaN(minutes) && minutes > 0
        ? Math.round(minutes * 60)
        : null,
    };
    onChange(next);
  }

  function handleCapacityChange(index: number, raw: string): void {
    const next = [...steps];
    const val = raw.trim() === "" ? null : Number(raw);
    next[index] = {
      ...next[index],
      maxCapacity: val !== null && !isNaN(val) && val > 0 ? val : null,
    };
    onChange(next);
  }

  function handleAdd(): void {
    onChange([...steps, { stationId: "", maxDurationSeconds: null, maxCapacity: null }]);
  }

  function handleRemove(index: number): void {
    if (steps.length <= 1) return;
    onChange(steps.filter((_, i) => i !== index));
  }

  function handleMoveUp(index: number): void {
    if (index === 0) return;
    const next = [...steps];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    onChange(next);
  }

  function handleMoveDown(index: number): void {
    if (index >= steps.length - 1) return;
    const next = [...steps];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    onChange(next);
  }

  const usedStationIds = new Set(steps.map((s) => s.stationId));
  const totalSeconds = steps.reduce((sum, s) => sum + (s.maxDurationSeconds ?? 0), 0);
  const allHaveDuration = steps.length > 0 && steps.every((s) => s.maxDurationSeconds !== null);

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <span className={styles.headerTitle}>Steps</span>
        <span className={styles.headerHint}>Each row = one station · set duration limits and tray capacity per step</span>
      </div>

      <table className={styles.table}>
        <thead className={styles.thead}>
          <tr>
            <th className={`${styles.th} ${styles.thLeft} ${styles.thIndent}`}>#</th>
            <th className={`${styles.th} ${styles.thLeft}`}>Station</th>
            <th className={styles.th} colSpan={2}>Duration (min)</th>
            <th className={styles.th} colSpan={2}>Items / tray</th>
            <th className={styles.th} />
          </tr>
          <tr>
            <th className={styles.thSub} />
            <th className={styles.thSub} />
            <th className={styles.thSub}>Min</th>
            <th className={styles.thSub}>Max</th>
            <th className={styles.thSub}>Min</th>
            <th className={styles.thSub}>Max</th>
            <th className={styles.thSub} />
          </tr>
        </thead>
        <tbody>
          {steps.map((step, index) => (
            <tr
              key={index}
              className={index < steps.length - 1 ? styles.rowBorder : ""}
            >
              <td className={`${styles.td} ${styles.tdIndent} ${styles.tdLeft}`}>
                <span className={styles.stepNum}>{index + 1}</span>
              </td>
              <td className={`${styles.td} ${styles.tdLeft}`}>
                <select
                  value={step.stationId}
                  onChange={(e) => handleStationChange(index, e.target.value)}
                  className={styles.select}
                >
                  <option value="">Select station...</option>
                  {stations.map((s) => (
                    <option
                      key={s.id}
                      value={s.id}
                      disabled={usedStationIds.has(s.id) && step.stationId !== s.id}
                    >
                      {s.name}
                    </option>
                  ))}
                </select>
              </td>
              <td className={styles.td}>
                <input
                  type="number"
                  min="1"
                  step="1"
                  placeholder="—"
                  className={styles.numInput}
                  title="Min duration in minutes"
                />
              </td>
              <td className={styles.td}>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={formatMinutes(step.maxDurationSeconds)}
                  onChange={(e) => handleDurationChange(index, e.target.value)}
                  placeholder="—"
                  className={styles.numInput}
                  title="Max duration in minutes"
                />
              </td>
              <td className={styles.td}>
                <input
                  type="number"
                  min="1"
                  step="1"
                  placeholder="—"
                  className={styles.numInput}
                  title="Min items per tray"
                />
              </td>
              <td className={styles.td}>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={step.maxCapacity ?? ""}
                  onChange={(e) => handleCapacityChange(index, e.target.value)}
                  placeholder="—"
                  className={styles.numInput}
                  title="Max items per tray"
                />
              </td>
              <td className={styles.td}>
                <div className={styles.actions}>
                  <div className={styles.orderGroup}>
                    <button
                      type="button"
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                      className={styles.orderBtn}
                      aria-label="Move step up"
                    >
                      <ChevronUp size={10} strokeWidth={1.5} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveDown(index)}
                      disabled={index >= steps.length - 1}
                      className={styles.orderBtn}
                      aria-label="Move step down"
                    >
                      <ChevronDown size={10} strokeWidth={1.5} />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemove(index)}
                    disabled={steps.length <= 1}
                    className={styles.removeBtn}
                    aria-label="Remove step"
                  >
                    <X size={12} strokeWidth={1.5} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className={styles.footer}>
        <button type="button" onClick={handleAdd} className={styles.addBtn}>
          <Plus size={13} strokeWidth={2} />
          Add step
        </button>
        {steps.length > 0 && (
          <span className={styles.summary}>
            {steps.length} step{steps.length !== 1 ? "s" : ""}
            {allHaveDuration && ` · ~${Math.round(totalSeconds / 60)} min total`}
          </span>
        )}
      </div>
    </div>
  );
}
