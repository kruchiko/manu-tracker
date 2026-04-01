import { useState } from "react";
import { JobForm } from "./JobForm";
import { QrPreview } from "./QrPreview";
import { JobList } from "./JobList";
import type { Job } from "../jobs.types";

export function JobsPage() {
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  return (
    <div className="mx-auto max-w-6xl">
      <h2 className="mb-6 text-xl font-semibold text-gray-900 print:hidden">Jobs</h2>

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-lg border bg-white p-6 shadow-sm print:hidden">
          <JobForm onJobCreated={setSelectedJob} />
        </div>

        <div
          className={`rounded-lg border bg-white p-6 shadow-sm${selectedJob === null ? " print:hidden" : ""}`}
        >
          {selectedJob !== null ? (
            <QrPreview job={selectedJob} />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-gray-400">
              Create a job to see the QR code
            </div>
          )}
        </div>
      </div>

      <div className="rounded-lg border bg-white p-6 shadow-sm print:hidden">
        <h3 className="mb-4 text-lg font-semibold">Recent Jobs</h3>
        <JobList
          selectedJobId={selectedJob?.id ?? null}
          onSelectJob={setSelectedJob}
        />
      </div>
    </div>
  );
}
