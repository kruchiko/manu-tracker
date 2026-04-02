import { useJobs } from "../hooks/useJobs";
import { useDeleteJob } from "../hooks/useDeleteJob";
import type { Job, JobStatus } from "../jobs.types";

const STATUS_LABEL: Record<JobStatus, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
};

const STATUS_COLOR: Record<JobStatus, string> = {
  pending: "bg-gray-100 text-gray-700",
  in_progress: "bg-yellow-100 text-yellow-800",
  completed: "bg-green-100 text-green-800",
};

interface JobListProps {
  selectedJobId: number | null;
  onSelectJob: (job: Job) => void;
}

export function JobList({ selectedJobId, onSelectJob }: JobListProps) {
  const { data, isLoading, error } = useJobs();
  const deleteMutation = useDeleteJob();

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
            <th className="py-2 pr-4 font-medium">Allocated</th>
            <th className="py-2 pr-4 font-medium">Status</th>
            <th className="py-2 pr-4 font-medium">Tray Code</th>
            <th className="py-2 pr-4 font-medium">Created At</th>
            <th className="py-2 font-medium"></th>
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
              <td className="py-2 pr-4">
                {job.allocatedQuantity === 0 ? (
                  <span className="inline-block rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-800">
                    Unassigned
                  </span>
                ) : (
                  <span className="text-xs text-gray-600">
                    {job.allocatedQuantity} / {job.quantity}
                  </span>
                )}
              </td>
              <td className="py-2 pr-4">
                <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[job.status]}`}>
                  {STATUS_LABEL[job.status]}
                </span>
              </td>
              <td className="py-2 pr-4 font-mono">{job.trayCode}</td>
              <td className="py-2 pr-4">
                {new Date(job.createdAt).toLocaleString()}
              </td>
              <td className="py-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Delete ${job.jobNumber}? This will also remove its allocations and tracking events.`)) {
                      deleteMutation.mutate(job.id);
                    }
                  }}
                  className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
