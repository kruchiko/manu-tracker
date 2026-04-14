import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { createWrapper } from "../../../test-utils";
import { PipelineList } from "./PipelineList";
import type { Pipeline } from "../pipelines.types";

vi.mock("../hooks/usePipelines", () => ({ usePipelines: vi.fn() }));
vi.mock("../hooks/useDeletePipeline", () => ({
  useDeletePipeline: vi.fn(),
}));

import { usePipelines } from "../hooks/usePipelines";
import { useDeletePipeline } from "../hooks/useDeletePipeline";

const samplePipeline: Pipeline = {
  id: "pipe-aaa",
  name: "Assembly Line",
  description: "Test",
  productType: "Widget",
  createdAt: "2026-01-01T00:00:00.000Z",
  steps: [
    {
      id: 1,
      stationId: "st-1",
      stationName: "Cut",
      position: 1,
      maxDurationSeconds: null,
      maxCapacity: null,
    },
    {
      id: 2,
      stationId: "st-2",
      stationName: "Polish",
      position: 2,
      maxDurationSeconds: null,
      maxCapacity: null,
    },
  ],
  totalExpectedSeconds: 300,
  effectiveCapacity: null,
};

describe("PipelineList", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(useDeletePipeline).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      error: null,
    } as unknown as ReturnType<typeof useDeletePipeline>);
  });

  it("should show loading skeleton", () => {
    vi.mocked(usePipelines).mockReturnValue({
      isLoading: true,
      error: null,
      data: undefined,
    } as unknown as ReturnType<typeof usePipelines>);

    const { container } = render(<PipelineList onEdit={vi.fn()} />, {
      wrapper: createWrapper(),
    });

    expect(screen.queryByText("All Pipelines")).not.toBeInTheDocument();
    expect(
      screen.queryByText("No pipelines yet. Create one to get started."),
    ).not.toBeInTheDocument();
    expect(container.firstElementChild).toBeInTheDocument();
  });

  it("should show error message when fetch fails", () => {
    vi.mocked(usePipelines).mockReturnValue({
      isLoading: false,
      error: new Error("Network error"),
      data: undefined,
    } as unknown as ReturnType<typeof usePipelines>);

    render(<PipelineList onEdit={vi.fn()} />, { wrapper: createWrapper() });

    expect(screen.getByText(/Network error/)).toBeInTheDocument();
  });

  it("should show empty state when there are no pipelines", () => {
    vi.mocked(usePipelines).mockReturnValue({
      isLoading: false,
      error: null,
      data: [],
    } as unknown as ReturnType<typeof usePipelines>);

    render(<PipelineList onEdit={vi.fn()} />, { wrapper: createWrapper() });

    expect(
      screen.getByText("No pipelines yet. Create one to get started."),
    ).toBeInTheDocument();
  });

  it("should render pipelines in a data table", () => {
    vi.mocked(usePipelines).mockReturnValue({
      isLoading: false,
      error: null,
      data: [samplePipeline],
    } as unknown as ReturnType<typeof usePipelines>);

    render(<PipelineList onEdit={vi.fn()} />, { wrapper: createWrapper() });

    expect(screen.getByText("All Pipelines")).toBeInTheDocument();
    expect(screen.getByText("1 pipeline")).toBeInTheDocument();
    expect(screen.getByText("Assembly Line")).toBeInTheDocument();
    expect(screen.getByText("Widget")).toBeInTheDocument();
    expect(screen.getByText("2 steps · ~5 min expected")).toBeInTheDocument();
    expect(screen.getByText("Pipeline")).toBeInTheDocument();
    expect(screen.getByText("Flow")).toBeInTheDocument();
    expect(screen.getByText("Actions")).toBeInTheDocument();
  });

  it("should call onEdit when a data row is activated", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    vi.mocked(usePipelines).mockReturnValue({
      isLoading: false,
      error: null,
      data: [samplePipeline],
    } as unknown as ReturnType<typeof usePipelines>);

    render(<PipelineList onEdit={onEdit} />, { wrapper: createWrapper() });

    await user.click(screen.getAllByRole("row")[1]);
    expect(onEdit).toHaveBeenCalledWith(samplePipeline);
  });

  it("should require confirm before delete mutates", async () => {
    const user = userEvent.setup();
    const mutate = vi.fn();
    vi.mocked(useDeletePipeline).mockReturnValue({
      mutate,
      isPending: false,
      error: null,
    } as unknown as ReturnType<typeof useDeletePipeline>);
    vi.mocked(usePipelines).mockReturnValue({
      isLoading: false,
      error: null,
      data: [samplePipeline],
    } as unknown as ReturnType<typeof usePipelines>);

    render(<PipelineList onEdit={vi.fn()} />, { wrapper: createWrapper() });

    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(mutate).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Confirm" }));
    expect(mutate).toHaveBeenCalledWith(samplePipeline.id, expect.any(Object));
  });

  it("should cancel delete confirmation without calling mutate", async () => {
    const user = userEvent.setup();
    const mutate = vi.fn();
    vi.mocked(useDeletePipeline).mockReturnValue({
      mutate,
      isPending: false,
      error: null,
    } as unknown as ReturnType<typeof useDeletePipeline>);
    vi.mocked(usePipelines).mockReturnValue({
      isLoading: false,
      error: null,
      data: [samplePipeline],
    } as unknown as ReturnType<typeof usePipelines>);

    render(<PipelineList onEdit={vi.fn()} />, { wrapper: createWrapper() });

    await user.click(screen.getByRole("button", { name: "Delete" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(mutate).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
  });
});
