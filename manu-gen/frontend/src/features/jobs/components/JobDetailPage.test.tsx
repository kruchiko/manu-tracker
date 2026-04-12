import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { createWrapper } from "../../../test-utils";
import type { Job } from "../jobs.types";
import { JobDetailPage } from "./JobDetailPage";

vi.mock("./QrPreview", async () => {
  const React = await import("react");
  return {
    QrPreview: function MockQrPreview({ onReady }: { onReady?: () => void }) {
      React.useEffect(() => {
        onReady?.();
      }, [onReady]);
      return React.createElement("div", { "data-testid": "qr-preview" }, "QR");
    },
  };
});

vi.mock("./JobJourneyChart", () => ({
  JobJourneyChart: () => null,
}));

vi.mock("./JobHistory", () => ({
  JobHistory: () => null,
}));

vi.mock("./PipelineProgress", () => ({
  PipelineProgress: () => null,
}));

vi.mock("./JobDetailKpis", () => ({
  JobDetailKpis: () => null,
}));

vi.mock("../../pipelines/hooks/usePipeline", () => ({
  usePipeline: () => ({ data: { steps: [] } }),
}));

vi.mock("../hooks/useJobHistory", () => ({
  useJobHistory: () => ({ data: [], isLoading: false, error: null }),
}));

const { deleteMutate } = vi.hoisted(() => ({
  deleteMutate: vi.fn(),
}));

vi.mock("../hooks/useDeleteJob", () => ({
  useDeleteJob: () => ({
    mutate: deleteMutate,
    isPending: false,
  }),
}));

const sampleJob: Job = {
  id: 42,
  jobNumber: "JOB-0042",
  productType: "Type B",
  quantity: 5,
  allocatedQuantity: 0,
  notes: "",
  trayCode: "TRAY-0042",
  createdAt: "2026-04-05T09:57:00.000Z",
  pipelineId: "pl-1",
  pipelineName: "First end to end pipeline",
  status: "pending",
};

describe("JobDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders job identity and product title", () => {
    render(<JobDetailPage job={sampleJob} onBack={vi.fn()} />, {
      wrapper: createWrapper(),
    });

    expect(screen.getAllByText(/JOB-0042/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole("heading", { name: "Type B" })).toBeInTheDocument();
  });

  it("shows the job status in the meta grid", () => {
    render(<JobDetailPage job={sampleJob} onBack={vi.fn()} />, {
      wrapper: createWrapper(),
    });

    const statusLabel = screen.getByText("Status");
    const metaCell = statusLabel.parentElement;
    expect(metaCell).toBeTruthy();
    expect(within(metaCell as HTMLElement).getByText("Pending")).toBeInTheDocument();
  });

  it("calls window.print when printAfterMount is true after QR is ready", async () => {
    const printSpy = vi.spyOn(window, "print").mockImplementation(() => {});
    const onConsumed = vi.fn();

    try {
      render(
        <JobDetailPage
          job={sampleJob}
          onBack={vi.fn()}
          printAfterMount
          onConsumedPrintIntent={onConsumed}
        />,
        { wrapper: createWrapper() },
      );

      await waitFor(() => {
        expect(printSpy).toHaveBeenCalled();
      });
      expect(onConsumed).toHaveBeenCalled();
    } finally {
      printSpy.mockRestore();
    }
  });

  it("opens confirm dialog and calls delete mutation when confirmed", async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();

    render(<JobDetailPage job={sampleJob} onBack={onBack} />, {
      wrapper: createWrapper(),
    });

    await user.click(screen.getByRole("button", { name: /Delete job/i }));

    const dialog = screen.getByRole("alertdialog");
    expect(dialog).toHaveAttribute("aria-describedby");
    const descId = dialog.getAttribute("aria-describedby")!;
    expect(document.getElementById(descId)).toHaveTextContent("JOB-0042");

    await user.click(within(dialog).getByRole("button", { name: "Delete job" }));

    expect(deleteMutate).toHaveBeenCalledWith(
      42,
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
  });
});
