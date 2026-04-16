import { useEffect, useRef } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import { JobBoardRow } from "./JobBoardRow";
import type { BoardJob } from "../dashboard.types";

interface JobBoardProps {
  selectedJobId: number | null;
  onSelectJob: (job: BoardJob) => void;
  /** Shared `useJobBoard()` result from parent so the tree does not subscribe twice. */
  boardQuery: UseQueryResult<BoardJob[], Error>;
}

export function JobBoard({ selectedJobId, onSelectJob, boardQuery }: JobBoardProps) {
  const { data, isLoading, error } = boardQuery;
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [data]);

  if (isLoading) {
    return <p className="text-sm text-gray-500">Loading job board...</p>;
  }

  if (error) {
    return <p className="text-sm text-red-600">Failed to load job board: {error.message}</p>;
  }

  const jobs = data ?? [];

  if (jobs.length === 0) {
    return <p className="text-sm text-gray-500">No jobs yet.</p>;
  }

  return (
    <div ref={scrollRef} className="min-h-0 flex-1 overflow-auto" style={{ maxHeight: "200px" }}>
      <table className="w-full text-sm" role="grid">
        <thead className="sticky top-0 bg-white">
          <tr className="border-b text-left text-gray-500">
            <th className="py-2 pr-4 font-medium">Job</th>
            <th className="py-2 pr-4 font-medium">Product</th>
            <th className="py-2 pr-4 font-medium">Status</th>
            <th className="py-2 pr-4 font-medium">Pipeline</th>
            <th className="py-2 pr-4 font-medium">Progress</th>
            <th className="py-2 pr-4 font-medium">Current Station</th>
            <th className="py-2 pr-4 font-medium">Time at Station</th>
            <th className="py-2 font-medium">Last Seen</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <JobBoardRow
              key={job.id}
              job={job}
              isSelected={selectedJobId === job.id}
              onSelect={onSelectJob}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
