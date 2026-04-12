import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { createWrapper } from "../../../test-utils";
import type { Job } from "../jobs.types";
import { NewJobManualView } from "./NewJobManualView";

const hoisted = vi.hoisted(() => ({
  mutate: vi.fn(),
}));

vi.mock("../../pipelines/hooks/usePipelines", () => ({
  usePipelines: () => ({
    data: [
      {
        id: "pl-1",
        name: "First pipeline",
        description: "Test",
        productType: "Widget",
        createdAt: "2026-01-01T00:00:00.000Z",
        steps: [],
        totalExpectedSeconds: null,
        effectiveCapacity: 100,
      },
    ],
  }),
}));

vi.mock("../hooks/useCreateJob", () => ({
  useCreateJob: () => ({
    mutate: hoisted.mutate,
    isPending: false,
    error: null,
  }),
}));

const createdJob: Job = {
  id: 99,
  jobNumber: "JOB-0099",
  productType: "Widget",
  quantity: 3,
  allocatedQuantity: 0,
  notes: "",
  trayCode: "TRAY-0099",
  createdAt: "2026-01-01T12:00:00.000Z",
  pipelineId: "pl-1",
  pipelineName: "First pipeline",
  status: "pending",
};

describe("NewJobManualView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hoisted.mutate.mockImplementation(
      (_values: unknown, opts?: { onSuccess?: (job: Job) => void }) => {
        opts?.onSuccess?.(createdJob);
      },
    );
  });

  it("submits the form and invokes onCreated with the new job", async () => {
    const user = userEvent.setup();
    const onCreated = vi.fn();
    const onBack = vi.fn();

    render(<NewJobManualView onBack={onBack} onCreated={onCreated} />, {
      wrapper: createWrapper(),
    });

    await user.selectOptions(screen.getByLabelText(/^Pipeline/i), "pl-1");
    await user.clear(screen.getByLabelText(/^Quantity/i));
    await user.type(screen.getByLabelText(/^Quantity/i), "3");
    await user.click(screen.getByRole("button", { name: /^Create Job$/i }));

    await waitFor(() => {
      expect(hoisted.mutate).toHaveBeenCalled();
    });

    expect(onCreated).toHaveBeenCalledWith(createdJob);
  });

  it("calls onBack when Cancel is clicked", async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();

    render(<NewJobManualView onBack={onBack} onCreated={vi.fn()} />, {
      wrapper: createWrapper(),
    });

    await user.click(screen.getByRole("button", { name: /^Cancel$/i }));

    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("shows validation error when pipeline is not selected", async () => {
    const user = userEvent.setup();

    render(<NewJobManualView onBack={vi.fn()} onCreated={vi.fn()} />, {
      wrapper: createWrapper(),
    });

    await user.click(screen.getByRole("button", { name: /^Create Job$/i }));

    expect(await screen.findByText("Pipeline is required")).toBeInTheDocument();
    expect(hoisted.mutate).not.toHaveBeenCalled();
  });
});
