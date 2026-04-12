import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { createWrapper } from "../../../test-utils";
import type { Job } from "../jobs.types";
import { JobsListView } from "./JobsListView";

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

describe("JobsListView", () => {
  it("marks the active filter segment with aria-pressed", async () => {
    const user = userEvent.setup();

    render(
      <JobsListView
        jobs={[sampleJob]}
        jobsLoading={false}
        jobsError={null}
        onCreateManual={vi.fn()}
        onViewJob={vi.fn()}
        onPrintJob={vi.fn()}
      />,
      { wrapper: createWrapper() },
    );

    const allBtn = screen.getByRole("button", { name: "All" });
    const pendingBtn = screen.getByRole("button", { name: "Pending" });

    expect(allBtn).toHaveAttribute("aria-pressed", "true");
    expect(pendingBtn).toHaveAttribute("aria-pressed", "false");

    await user.click(pendingBtn);

    expect(allBtn).toHaveAttribute("aria-pressed", "false");
    expect(pendingBtn).toHaveAttribute("aria-pressed", "true");
  });
});
