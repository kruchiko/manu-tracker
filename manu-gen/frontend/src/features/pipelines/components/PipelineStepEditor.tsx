import type { Station } from "../../stations/stations.types";
import type { StepFormValue } from "../pipelines.schema";

interface PipelineStepEditorProps {
  steps: StepFormValue[];
  stations: Station[];
  onChange: (steps: StepFormValue[]) => void;
}

function formatMinutes(seconds: number | null): string {
  if (seconds === null) return "";
  return String(seconds / 60);
}

export function PipelineStepEditor({ steps, stations, onChange }: PipelineStepEditorProps) {
  function handleStationChange(index: number, stationId: string) {
    const next = [...steps];
    next[index] = { ...next[index], stationId };
    onChange(next);
  }

  function handleDurationChange(index: number, raw: string) {
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

  function handleAdd() {
    onChange([...steps, { stationId: "", maxDurationSeconds: null }]);
  }

  function handleRemove(index: number) {
    if (steps.length <= 1) return;
    onChange(steps.filter((_, i) => i !== index));
  }

  function handleMoveUp(index: number) {
    if (index === 0) return;
    const next = [...steps];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    onChange(next);
  }

  function handleMoveDown(index: number) {
    if (index >= steps.length - 1) return;
    const next = [...steps];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    onChange(next);
  }

  const usedStationIds = new Set(steps.map((s) => s.stationId));

  const totalSeconds = steps.reduce((sum, s) => sum + (s.maxDurationSeconds ?? 0), 0);
  const allHaveDuration = steps.length > 0 && steps.every((s) => s.maxDurationSeconds !== null);

  return (
    <div>
      <div className="space-y-2">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center gap-2 rounded border bg-gray-50 px-3 py-2">
            <span className="w-6 shrink-0 text-center text-xs font-medium text-gray-400">{index + 1}</span>

            <select
              value={step.stationId}
              onChange={(e) => handleStationChange(index, e.target.value)}
              className="min-w-0 flex-1 rounded border bg-white px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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

            <input
              type="number"
              min="1"
              step="1"
              value={formatMinutes(step.maxDurationSeconds)}
              onChange={(e) => handleDurationChange(index, e.target.value)}
              placeholder="min"
              className="w-20 shrink-0 rounded border px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Expected duration in minutes"
            />

            <div className="flex gap-0.5">
              <button
                type="button"
                onClick={() => handleMoveUp(index)}
                disabled={index === 0}
                className="rounded p-1 text-gray-400 hover:bg-gray-200 disabled:opacity-30"
                aria-label="Move step up"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => handleMoveDown(index)}
                disabled={index >= steps.length - 1}
                className="rounded p-1 text-gray-400 hover:bg-gray-200 disabled:opacity-30"
                aria-label="Move step down"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => handleRemove(index)}
                disabled={steps.length <= 1}
                className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-30"
                aria-label="Remove step"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <button
          type="button"
          onClick={handleAdd}
          className="rounded border border-dashed border-gray-300 px-3 py-1.5 text-sm text-gray-500 hover:border-gray-400 hover:text-gray-700"
        >
          + Add step
        </button>

        {steps.length > 0 && (
          <p className="text-xs text-gray-400">
            {steps.length} step{steps.length !== 1 ? "s" : ""}
            {allHaveDuration && (
              <span className="ml-1">
                &middot; total ~{Math.round(totalSeconds / 60)}m expected
              </span>
            )}
          </p>
        )}
      </div>
    </div>
  );
}
