import { useJobs } from "../hooks/useJobs";
import type { Job } from "../jobs.types";

interface JobListProps {
  selectedJobId: number | null;
  onSelectJob: (job: Job) => void;
}

export function JobList({ selectedJobId, onSelectJob }: JobListProps) {
  const { data, isLoading, error } = useJobs();

  if (isLoading) {
    return <p className="text-sm text-gray-500">Loading jobs…</p>;
  }

  if (error) {
    return <p className="text-sm text-red-600">Failed to load jobs: {error.message}</p>;
  }

  const jobs = data ?? [];

  if (jobs.length === 0) {
    return (
      <p className="text-sm text-gray-500">No jobs yet. Create one above.</p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm" role="grid">
        <thead>
          <tr className="border-b text-left text-gray-500">
            <th className="py-2 pr-4 font-medium">Job #</th>
            <th className="py-2 pr-4 font-medium">Product</th>
            <th className="py-2 pr-4 font-medium">Pipeline</th>
            <th className="py-2 pr-4 font-medium">Qty</th>
            <th className="py-2 pr-4 font-medium">Tray Code</th>
            <th className="py-2 font-medium">Created At</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <tr
              key={job.id}
              onClick={() => onSelectJob(job)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectJob(job);
                }
              }}
              tabIndex={0}
              aria-selected={selectedJobId === job.id}
              className={`cursor-pointer border-b hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 ${
                selectedJobId === job.id ? "bg-blue-50" : ""
              }`}
            >
              <td className="py-2 pr-4 font-mono">{job.jobNumber}</td>
              <td className="py-2 pr-4">{job.productType}</td>
              <td className="py-2 pr-4">{job.pipelineName}</td>
              <td className="py-2 pr-4">{job.quantity}</td>
              <td className="py-2 pr-4 font-mono">{job.trayCode}</td>
              <td className="py-2">
                {new Date(job.createdAt).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
