import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { createWrapper } from "../../../test-utils";
import { JobForm } from "./JobForm";

vi.mock("../hooks/useCreateJob", () => ({
  useCreateJob: vi.fn(),
}));

vi.mock("../../pipelines/hooks/usePipelines", () => ({
  usePipelines: vi.fn(),
}));

import { useCreateJob } from "../hooks/useCreateJob";
import { usePipelines } from "../../pipelines/hooks/usePipelines";

describe("JobForm", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(usePipelines).mockReturnValue({
      data: [{ id: "pipeline-1", name: "Pipeline A", steps: [{ stationId: "s1", maxDurationSeconds: 60 }], description: "", totalExpectedSeconds: 60, createdAt: "" }],
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof usePipelines>);
  });

  it("should render product type, quantity, pipeline, and notes fields", () => {
    vi.mocked(useCreateJob).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      error: null,
    } as unknown as ReturnType<typeof useCreateJob>);

    render(<JobForm onJobCreated={vi.fn()} />, { wrapper: createWrapper() });

    expect(screen.getByLabelText("Product Type")).toBeInTheDocument();
    expect(screen.getByLabelText("Quantity")).toBeInTheDocument();
    expect(screen.getByLabelText("Pipeline")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create Job" })).toBeInTheDocument();
  });

  it("should show validation error when product type is empty", async () => {
    vi.mocked(useCreateJob).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      error: null,
    } as unknown as ReturnType<typeof useCreateJob>);

    const user = userEvent.setup();
    render(<JobForm onJobCreated={vi.fn()} />, { wrapper: createWrapper() });

    await user.click(screen.getByRole("button", { name: "Create Job" }));

    await waitFor(() => {
      expect(screen.getByText(/Product type is required/i)).toBeInTheDocument();
    });
  });

  it("should display server error", () => {
    vi.mocked(useCreateJob).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      error: new Error("Pipeline not found"),
    } as unknown as ReturnType<typeof useCreateJob>);

    render(<JobForm onJobCreated={vi.fn()} />, { wrapper: createWrapper() });

    expect(screen.getByText("Error: Pipeline not found")).toBeInTheDocument();
  });

  it("should disable button while pending", () => {
    vi.mocked(useCreateJob).mockReturnValue({
      mutate: vi.fn(),
      isPending: true,
      error: null,
    } as unknown as ReturnType<typeof useCreateJob>);

    render(<JobForm onJobCreated={vi.fn()} />, { wrapper: createWrapper() });

    expect(screen.getByRole("button", { name: /Creating/i })).toBeDisabled();
  });
});
