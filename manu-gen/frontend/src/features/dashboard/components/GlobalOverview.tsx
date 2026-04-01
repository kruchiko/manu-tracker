import { JobBoard } from "./JobBoard";
import { StationDurations } from "./StationDurations";
import { KpiCards } from "./KpiCards";
import { ActivitySparklines } from "./ActivitySparklines";
import type { BoardJob } from "../dashboard.types";

interface GlobalOverviewProps {
  selectedJobId: number | null;
  onSelectJob: (job: BoardJob) => void;
}

export function GlobalOverview({ selectedJobId, onSelectJob }: GlobalOverviewProps) {
  return (
    <>
      <KpiCards />

      <div className="flex flex-col rounded-lg border bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold">Live Job Board</h3>
        <JobBoard
          selectedJobId={selectedJobId}
          onSelectJob={onSelectJob}
        />
      </div>

      <div className="mt-6 rounded-lg border bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold">Stage Duration Analytics</h3>
        <StationDurations />
      </div>

      <div className="mt-6 rounded-lg border bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold">Station Activity (24h)</h3>
        <ActivitySparklines />
      </div>
    </>
  );
}
