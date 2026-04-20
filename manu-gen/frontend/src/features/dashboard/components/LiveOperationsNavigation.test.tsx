import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { vi } from "vitest";
import { JobsPage } from "../../jobs/components/JobsPage";
import type { Job } from "../../jobs/jobs.types";
import type { BoardJob } from "../dashboard.types";
import { LiveOperationsPage } from "./LiveOperationsPage";
import {
  JOB_DETAIL_RETURN_FROM_PARAM,
  JOB_DETAIL_RETURN_FROM_LIVE_OPS,
} from "../../../shared/navigation/pageRoutes";

vi.mock("../hooks/useJobBoard", () => ({
  useJobBoard: vi.fn(),
}));

vi.mock("../hooks/useSummary", () => ({
  useSummary: vi.fn(),
}));

vi.mock("../hooks/useDurations", () => ({
  useDurations: vi.fn(),
}));

vi.mock("../hooks/useActivity", () => ({
  useActivity: vi.fn(),
}));

vi.mock("../../jobs/hooks/useJobs", () => ({
  useJobs: vi.fn(),
}));

vi.mock("../../jobs/hooks/useJob", () => ({
  useJob: vi.fn(),
}));

vi.mock("../../jobs/components/QrPreview", async () => {
  const React = await import("react");
  return {
    QrPreview: function MockQrPreview({ onReady }: { onReady?: () => void }) {
      React.useEffect(() => {
        onReady?.();
      }, [onReady]);
      return React.createElement("div", { "data-testid": "qr-preview" });
    },
  };
});

vi.mock("../../pipelines/hooks/usePipeline", () => ({
  usePipeline: () => ({ data: { steps: [] } }),
}));

vi.mock("../../pipelines/hooks/usePipelines", () => ({
  usePipelines: () => ({
    data: [
      {
        id: "pl-1",
        name: "Test Pipeline",
        description: "",
        productType: "Widget",
        createdAt: "2026-01-01T00:00:00.000Z",
        steps: [],
        totalExpectedSeconds: null,
        effectiveCapacity: 100,
      },
    ],
  }),
}));

vi.mock("../../jobs/hooks/useJobHistory", () => ({
  useJobHistory: () => ({ data: [], isLoading: false, error: null }),
}));

vi.mock("../../jobs/hooks/useDeleteJob", () => ({
  useDeleteJob: () => ({ mutate: vi.fn(), isPending: false }),
}));

import { useJobBoard } from "../hooks/useJobBoard";
import { useSummary } from "../hooks/useSummary";
import { useDurations } from "../hooks/useDurations";
import { useActivity } from "../hooks/useActivity";
import { useJobs } from "../../jobs/hooks/useJobs";
import { useJob } from "../../jobs/hooks/useJob";

const boardJob: BoardJob = {
  id: 42,
  jobNumber: "JOB-0042",
  productType: "NavTestProduct",
  trayCode: "TRAY-0042",
  createdAt: "2026-01-01T00:00:00.000Z",
  status: "pending",
  currentStation: null,
  lastSeenAt: null,
  stationArrivedAt: null,
  maxDurationSeconds: null,
  pipeline: {
    id: "pl-1",
    name: "Test Pipeline",
    stepPosition: 1,
    totalSteps: 3,
    expectedSeconds: null,
    elapsedSeconds: null,
  },
};

const detailJob: Job = {
  id: 42,
  jobNumber: "JOB-0042",
  productType: "NavTestProduct",
  quantity: 1,
  allocatedQuantity: 0,
  notes: "",
  trayCode: "TRAY-0042",
  createdAt: "2026-01-01T00:00:00.000Z",
  pipelineId: "pl-1",
  pipelineName: "Test Pipeline",
  status: "pending",
};

function renderLiveOpsWithJobsRoutes(initialPath: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 0 } },
  });
  const router = createMemoryRouter(
    [
      { path: "/live-operations", element: <LiveOperationsPage /> },
      { path: "/jobs/:jobId?", element: <JobsPage /> },
    ],
    { initialEntries: [initialPath] },
  );
  const view = render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return { ...view, router, queryClient };
}

describe("LiveOperationsPage navigation", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(useJobBoard).mockReturnValue({
      data: [boardJob],
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useJobBoard>);
    vi.mocked(useSummary).mockReturnValue({
      data: {
        activeJobs: 1,
        totalTrackedJobs: 1,
        avgDwellSeconds: 0,
        bottleneckStation: null,
        thresholdViolations: 0,
      },
      isLoading: false,
    } as unknown as ReturnType<typeof useSummary>);
    vi.mocked(useDurations).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useDurations>);
    vi.mocked(useActivity).mockReturnValue({
      data: [],
      isLoading: false,
    } as unknown as ReturnType<typeof useActivity>);
    vi.mocked(useJobs).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useJobs>);
    vi.mocked(useJob).mockImplementation((jobId) => {
      if (jobId === 42) {
        return {
          data: detailJob,
          isLoading: false,
          isError: false,
          error: null,
        } as unknown as ReturnType<typeof useJob>;
      }
      return {
        data: undefined,
        isLoading: jobId != null,
        isError: false,
        error: null,
      } as unknown as ReturnType<typeof useJob>;
    });
  });

  it("opens job detail with return-from query and returns to Live Operations", async () => {
    const user = userEvent.setup();
    const { router } = renderLiveOpsWithJobsRoutes("/live-operations");

    await screen.findByText("JOB-0042");
    const row = screen.getByText("JOB-0042").closest("tr");
    expect(row).toBeTruthy();
    await user.click(row!);

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/jobs/42");
      expect(router.state.location.search).toBe(
        `?${JOB_DETAIL_RETURN_FROM_PARAM}=${JOB_DETAIL_RETURN_FROM_LIVE_OPS}`,
      );
    });

    expect(await screen.findByRole("heading", { name: "NavTestProduct" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Back to Live Operations/i }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/live-operations");
    });
  });
});
