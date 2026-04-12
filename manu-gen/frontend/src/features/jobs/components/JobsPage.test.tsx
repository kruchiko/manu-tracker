import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { createWrapper } from "../../../test-utils";
import type { Job } from "../jobs.types";
import { JobsPage } from "./JobsPage";

vi.mock("../hooks/useJobs", () => ({
  useJobs: vi.fn(),
}));

vi.mock("./QrPreview", async () => {
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

vi.mock("../hooks/useJobHistory", () => ({
  useJobHistory: () => ({ data: [], isLoading: false, error: null }),
}));

vi.mock("../hooks/useDeleteJob", () => ({
  useDeleteJob: () => ({ mutate: vi.fn(), isPending: false }),
}));

const { createMutate } = vi.hoisted(() => ({
  createMutate: vi.fn(),
}));

vi.mock("../hooks/useCreateJob", () => ({
  useCreateJob: () => ({
    mutate: createMutate,
    isPending: false,
    error: null,
  }),
}));

import { useJobs } from "../hooks/useJobs";

const listJob: Job = {
  id: 7,
  jobNumber: "JOB-0007",
  productType: "Gadget",
  quantity: 2,
  allocatedQuantity: 0,
  notes: "",
  trayCode: "TRAY-0007",
  createdAt: "2026-01-01T00:00:00.000Z",
  pipelineId: "pl-1",
  pipelineName: "Test Pipeline",
  status: "pending",
};

const createdJob: Job = {
  id: 8,
  jobNumber: "JOB-0008",
  productType: "Widget",
  quantity: 1,
  allocatedQuantity: 0,
  notes: "",
  trayCode: "TRAY-0008",
  createdAt: "2026-01-02T00:00:00.000Z",
  pipelineId: "pl-1",
  pipelineName: "Test Pipeline",
  status: "pending",
};

describe("JobsPage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    createMutate.mockImplementation(
      (_v: unknown, opts?: { onSuccess?: (job: Job) => void }) => {
        opts?.onSuccess?.(createdJob);
      },
    );
  });

  it("renders the jobs list view with header when list is the active view", () => {
    vi.mocked(useJobs).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useJobs>);

    render(<JobsPage />, { wrapper: createWrapper() });

    expect(screen.getByRole("heading", { name: "Jobs" })).toBeInTheDocument();
    expect(screen.getByText("All Jobs")).toBeInTheDocument();
  });

  it("enables the jobs query only on the list view", () => {
    vi.mocked(useJobs).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useJobs>);

    render(<JobsPage />, { wrapper: createWrapper() });

    expect(useJobs).toHaveBeenCalledWith({ enabled: true });
  });

  it("navigates to create job, disables the list query, then returns to the list on cancel", async () => {
    const user = userEvent.setup();
    vi.mocked(useJobs).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useJobs>);

    render(<JobsPage />, { wrapper: createWrapper() });

    await user.click(screen.getByRole("button", { name: /Create Job manually/i }));

    await waitFor(() => {
      expect(useJobs).toHaveBeenLastCalledWith({ enabled: false });
    });

    expect(screen.getByRole("heading", { name: "Create Job manually" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^Cancel$/i }));

    await waitFor(() => {
      expect(useJobs).toHaveBeenLastCalledWith({ enabled: true });
    });

    expect(screen.getByRole("heading", { name: "Jobs" })).toBeInTheDocument();
  });

  it("navigates to job detail when View is clicked and back to the list", async () => {
    const user = userEvent.setup();
    vi.mocked(useJobs).mockReturnValue({
      data: [listJob],
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useJobs>);

    render(<JobsPage />, { wrapper: createWrapper() });

    await user.click(screen.getByRole("button", { name: "View" }));

    expect(screen.getByRole("heading", { name: "Gadget" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Jobs" }));

    expect(screen.getByRole("heading", { name: "Jobs" })).toBeInTheDocument();
  });

  it("disables the jobs query while job detail is open for print intent", async () => {
    const user = userEvent.setup();
    const printSpy = vi.spyOn(window, "print").mockImplementation(() => {});

    try {
      vi.mocked(useJobs).mockReturnValue({
        data: [listJob],
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useJobs>);

      render(<JobsPage />, { wrapper: createWrapper() });

      await user.click(screen.getByRole("button", { name: /Print Label/i }));

      await waitFor(() => {
        expect(useJobs).toHaveBeenLastCalledWith({ enabled: false });
      });

      await waitFor(() => {
        expect(printSpy).toHaveBeenCalled();
      });
    } finally {
      printSpy.mockRestore();
    }
  });

  it("navigates to detail after creating a job", async () => {
    const user = userEvent.setup();
    vi.mocked(useJobs).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useJobs>);

    render(<JobsPage />, { wrapper: createWrapper() });

    await user.click(screen.getByRole("button", { name: /Create Job manually/i }));
    await user.selectOptions(screen.getByLabelText(/^Pipeline/i), "pl-1");
    await user.click(screen.getByRole("button", { name: /^Create Job$/i }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Widget" })).toBeInTheDocument();
    });
  });
});
