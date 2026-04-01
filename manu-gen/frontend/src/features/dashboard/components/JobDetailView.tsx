import { useJobHistory } from "../hooks/useJobHistory";
import { JobJourneyChart } from "./JobJourneyChart";
import { JobHistory } from "./JobHistory";
import { PipelineProgress } from "./PipelineProgress";
import { usePipeline } from "../../pipelines/hooks/usePipeline";
import type { BoardJob, JobHistoryEntry } from "../dashboard.types";
import { formatDuration } from "../dashboard.utils";

interface JobDetailViewProps {
  job: BoardJob;
  onBack: () => void;
}

interface JourneyStats {
  totalTrackedSeconds: number;
  stationVisits: number;
  longestDwellSeconds: number;
  longestDwellStation: string;
}

function computeStats(entries: JobHistoryEntry[]): JourneyStats {
  let totalTrackedSeconds = 0;
  let longestDwellSeconds = 0;
  let longestDwellStation = "";
  let stationVisits = 0;

  for (const entry of entries) {
    if (entry.durationSeconds === null || entry.durationSeconds <= 0) continue;

    if (entry.phase === "departed" || entry.phase === "scan") {
      totalTrackedSeconds += entry.durationSeconds;
      stationVisits++;
      if (entry.durationSeconds > longestDwellSeconds) {
        longestDwellSeconds = entry.durationSeconds;
        longestDwellStation = entry.station;
      }
    }
  }

  return { totalTrackedSeconds, stationVisits, longestDwellSeconds, longestDwellStation };
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border bg-gray-50 px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

export function JobDetailView({ job, onBack }: JobDetailViewProps) {
  const { data, isLoading, error } = useJobHistory(job.id);
  const { data: pipelineData } = usePipeline(job.pipeline.id);
  const entries = data ?? [];
  const stats = computeStats(entries);

  return (
    <div className="mx-auto max-w-6xl">
      <button
        type="button"
        onClick={onBack}
        className="mb-4 inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to overview
      </button>

      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          {job.jobNumber} — {job.productType}
        </h2>
        <p className="text-sm text-gray-500">{job.trayCode}</p>
      </div>

      {isLoading && <p className="text-sm text-gray-500">Loading job details...</p>}
      {error && <p className="text-sm text-red-600">Failed to load job details: {error.message}</p>}

      {!isLoading && !error && (
        <>
          {pipelineData && (
            <div className="mb-6">
              <PipelineProgress
                pipeline={job.pipeline}
                steps={pipelineData.steps}
                historyEntries={entries}
              />
            </div>
          )}

          <div className={`mb-6 grid grid-cols-1 gap-4 ${job.pipeline.expectedSeconds != null ? "sm:grid-cols-4" : "sm:grid-cols-3"}`}>
            <StatCard
              label="Total tracked time"
              value={stats.totalTrackedSeconds > 0 ? formatDuration(stats.totalTrackedSeconds) : "--"}
            />
            <StatCard
              label="Station visits"
              value={stats.stationVisits > 0 ? String(stats.stationVisits) : "--"}
            />
            <StatCard
              label="Longest dwell"
              value={stats.longestDwellSeconds > 0 ? formatDuration(stats.longestDwellSeconds) : "--"}
              sub={stats.longestDwellStation || undefined}
            />
            {job.pipeline.expectedSeconds != null && job.pipeline.elapsedSeconds != null && (
              <StatCard
                label="Pipeline ETA"
                value={
                  job.pipeline.elapsedSeconds <= job.pipeline.expectedSeconds
                    ? formatDuration(job.pipeline.expectedSeconds - job.pipeline.elapsedSeconds)
                    : `Overdue ${formatDuration(job.pipeline.elapsedSeconds - job.pipeline.expectedSeconds)}`
                }
                sub={`${formatDuration(job.pipeline.elapsedSeconds)} of ${formatDuration(job.pipeline.expectedSeconds)}`}
              />
            )}
          </div>

          {entries.length > 0 && (
            <div className="mb-6 rounded-lg border bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold">Time Distribution by Station</h3>
              <JobJourneyChart entries={entries} />
            </div>
          )}

          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold">Event Timeline</h3>
            <JobHistory job={job} embedded />
          </div>
        </>
      )}
    </div>
  );
}
