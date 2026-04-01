import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { createWrapper } from "../../../test-utils";
import { JobList } from "./JobList";

vi.mock("../hooks/useJobs", () => ({
  useJobs: vi.fn(),
}));

import { useJobs } from "../hooks/useJobs";

const sampleJobs = [
  {
    id: 1,
    jobNumber: "JOB-0001",
    productType: "Widget",
    quantity: 10,
    notes: "",
    trayCode: "TRAY-0001",
    createdAt: "2026-01-01T00:00:00.000Z",
    pipelineId: "pipeline-abc",
    pipelineName: "Pipeline A",
  },
];

describe("JobList", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should show loading state", () => {
    vi.mocked(useJobs).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as unknown as ReturnType<typeof useJobs>);

    render(<JobList selectedJobId={null} onSelectJob={vi.fn()} />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText(/Loading/)).toBeInTheDocument();
  });

  it("should show error state", () => {
    vi.mocked(useJobs).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error("Network error"),
    } as unknown as ReturnType<typeof useJobs>);

    render(<JobList selectedJobId={null} onSelectJob={vi.fn()} />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText(/Failed to load jobs/)).toBeInTheDocument();
  });

  it("should show empty state when no jobs exist", () => {
    vi.mocked(useJobs).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useJobs>);

    render(<JobList selectedJobId={null} onSelectJob={vi.fn()} />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText(/No jobs yet/)).toBeInTheDocument();
  });

  it("should render job rows", () => {
    vi.mocked(useJobs).mockReturnValue({
      data: sampleJobs,
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useJobs>);

    render(<JobList selectedJobId={null} onSelectJob={vi.fn()} />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText("JOB-0001")).toBeInTheDocument();
    expect(screen.getByText("Widget")).toBeInTheDocument();
    expect(screen.getByText("Pipeline A")).toBeInTheDocument();
  });
});
