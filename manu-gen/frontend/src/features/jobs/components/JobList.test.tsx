import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { createWrapper } from "../../../test-utils";
import type { Job } from "../jobs.types";
import { JobList } from "./JobList";

const sampleJob: Job = {
  id: 1,
  jobNumber: "JOB-0001",
  productType: "Widget",
  quantity: 10,
  allocatedQuantity: 0,
  notes: "",
  trayCode: "TRAY-0001",
  createdAt: "2026-01-01T00:00:00.000Z",
  pipelineId: "pipeline-abc",
  pipelineName: "Pipeline A",
  status: "pending",
};

describe("JobList", () => {
  it("should show loading state", () => {
    render(
      <JobList
        jobs={undefined}
        jobsLoading
        jobsError={null}
        filter="all"
        onViewJob={vi.fn()}
        onPrintJob={vi.fn()}
      />,
      { wrapper: createWrapper() },
    );

    expect(screen.getByText(/Loading/)).toBeInTheDocument();
  });

  it("should show error state", () => {
    render(
      <JobList
        jobs={undefined}
        jobsLoading={false}
        jobsError={new Error("Network error")}
        filter="all"
        onViewJob={vi.fn()}
        onPrintJob={vi.fn()}
      />,
      { wrapper: createWrapper() },
    );

    expect(screen.getByText(/Failed to load jobs/)).toBeInTheDocument();
  });

  it("should show loading when jobs are undefined but not in error (query gap)", () => {
    render(
      <JobList
        jobs={undefined}
        jobsLoading={false}
        jobsError={null}
        filter="all"
        onViewJob={vi.fn()}
        onPrintJob={vi.fn()}
      />,
      { wrapper: createWrapper() },
    );

    expect(screen.getByText(/Loading jobs/)).toBeInTheDocument();
  });

  it("should show empty state when no jobs exist", () => {
    render(
      <JobList
        jobs={[]}
        jobsLoading={false}
        jobsError={null}
        filter="all"
        onViewJob={vi.fn()}
        onPrintJob={vi.fn()}
      />,
      { wrapper: createWrapper() },
    );

    expect(screen.getByRole("heading", { name: /No jobs yet/i })).toBeInTheDocument();
    expect(screen.getByText(/page header/i)).toBeInTheDocument();
  });

  it("should show filtered empty state when jobs exist but none match the tab, and call onShowAllJobs", async () => {
    const user = userEvent.setup();
    const onShowAllJobs = vi.fn();

    render(
      <JobList
        jobs={[sampleJob]}
        jobsLoading={false}
        jobsError={null}
        filter="in_progress"
        onViewJob={vi.fn()}
        onPrintJob={vi.fn()}
        onShowAllJobs={onShowAllJobs}
      />,
      { wrapper: createWrapper() },
    );

    const region = screen.getByRole("status");
    expect(within(region).getByRole("heading", { name: /No In Progress jobs/i })).toBeInTheDocument();
    expect(within(region).getByText(/You have 1 job, but none are/i)).toBeInTheDocument();
    expect(within(region).getByText("In Progress")).toBeInTheDocument();
    await user.click(within(region).getByRole("button", { name: /View all jobs/i }));
    expect(onShowAllJobs).toHaveBeenCalledTimes(1);
  });

  it("should pluralize job count in filtered empty state", () => {
    const second: Job = { ...sampleJob, id: 2, jobNumber: "JOB-0002" };

    render(
      <JobList
        jobs={[sampleJob, second]}
        jobsLoading={false}
        jobsError={null}
        filter="completed"
        onViewJob={vi.fn()}
        onPrintJob={vi.fn()}
      />,
      { wrapper: createWrapper() },
    );

    expect(
      within(screen.getByRole("status")).getByText(/You have 2 jobs, but none are/i),
    ).toBeInTheDocument();
  });

  it("should render job rows", () => {
    render(
      <JobList
        jobs={[sampleJob]}
        jobsLoading={false}
        jobsError={null}
        filter="all"
        onViewJob={vi.fn()}
        onPrintJob={vi.fn()}
      />,
      { wrapper: createWrapper() },
    );

    expect(screen.getByText("JOB-0001")).toBeInTheDocument();
    expect(screen.getByText("Widget")).toBeInTheDocument();
    expect(screen.getByText("Pipeline A")).toBeInTheDocument();
  });

  it("should call onViewJob when View is clicked", async () => {
    const user = userEvent.setup();
    const onViewJob = vi.fn();

    render(
      <JobList
        jobs={[sampleJob]}
        jobsLoading={false}
        jobsError={null}
        filter="all"
        onViewJob={onViewJob}
        onPrintJob={vi.fn()}
      />,
      { wrapper: createWrapper() },
    );

    await user.click(screen.getByRole("button", { name: "View" }));
    expect(onViewJob).toHaveBeenCalledWith(sampleJob);
  });

  it("should call onPrintJob when Print Label is clicked", async () => {
    const user = userEvent.setup();
    const onPrintJob = vi.fn();

    render(
      <JobList
        jobs={[sampleJob]}
        jobsLoading={false}
        jobsError={null}
        filter="all"
        onViewJob={vi.fn()}
        onPrintJob={onPrintJob}
      />,
      { wrapper: createWrapper() },
    );

    await user.click(screen.getByRole("button", { name: /Print Label/i }));
    expect(onPrintJob).toHaveBeenCalledWith(sampleJob);
  });
});
