import { render, screen } from "@testing-library/react";
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

    expect(screen.getByText(/No jobs yet/)).toBeInTheDocument();
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
