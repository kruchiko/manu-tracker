import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OrderForm } from "./OrderForm";
import { vi } from "vitest";
import { createWrapper } from "../../../test-utils";
import type { Order } from "../orders.types";

vi.mock("../hooks/useCreateOrder", () => ({
  useCreateOrder: vi.fn(),
}));

vi.mock("../../pipelines/hooks/usePipelines", () => ({
  usePipelines: vi.fn(),
}));

import { useCreateOrder } from "../hooks/useCreateOrder";
import { usePipelines } from "../../pipelines/hooks/usePipelines";

const samplePipelines = [
  { id: "pipeline-abc", name: "Standard Flow", description: "", createdAt: "", steps: [], totalExpectedSeconds: null },
];

const sampleOrder: Order = {
  id: 42,
  orderNumber: "ORD-0042",
  customerName: "Acme Corp",
  productType: "Widget A",
  quantity: 5,
  notes: "",
  trayCode: "TRAY-0042",
  pipelineId: "pipeline-abc",
  pipelineName: "Standard Flow",
  createdAt: "2024-01-01T00:00:00Z",
};

function mockPipelines() {
  vi.mocked(usePipelines).mockReturnValue({
    data: samplePipelines,
    isLoading: false,
    error: null,
  } as unknown as ReturnType<typeof usePipelines>);
}

describe("OrderForm", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockPipelines();
  });

  it("should render all form fields", () => {
    vi.mocked(useCreateOrder).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      error: null,
    } as unknown as ReturnType<typeof useCreateOrder>);

    render(<OrderForm onOrderCreated={vi.fn()} />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByLabelText("Customer Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Product Type")).toBeInTheDocument();
    expect(screen.getByLabelText("Quantity")).toBeInTheDocument();
    expect(screen.getByLabelText("Pipeline")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Create Order" }),
    ).toBeInTheDocument();
  });

  it("should show validation errors when submitted empty", async () => {
    vi.mocked(useCreateOrder).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      error: null,
    } as unknown as ReturnType<typeof useCreateOrder>);

    const user = userEvent.setup();
    render(<OrderForm onOrderCreated={vi.fn()} />, {
      wrapper: createWrapper(),
    });

    await user.click(screen.getByRole("button", { name: "Create Order" }));

    await waitFor(() => {
      expect(screen.getByText("Customer name is required")).toBeInTheDocument();
      expect(screen.getByText("Product type is required")).toBeInTheDocument();
      expect(screen.getByText("Pipeline is required")).toBeInTheDocument();
    });
  });

  it("should call mutate with form values on valid submit", async () => {
    const mutate = vi.fn();
    vi.mocked(useCreateOrder).mockReturnValue({
      mutate,
      isPending: false,
      error: null,
    } as unknown as ReturnType<typeof useCreateOrder>);

    const user = userEvent.setup();
    render(<OrderForm onOrderCreated={vi.fn()} />, {
      wrapper: createWrapper(),
    });

    await user.type(screen.getByLabelText("Customer Name"), "Acme Corp");
    await user.type(screen.getByLabelText("Product Type"), "Widget A");
    await user.clear(screen.getByLabelText("Quantity"));
    await user.type(screen.getByLabelText("Quantity"), "5");
    await user.selectOptions(screen.getByLabelText("Pipeline"), "pipeline-abc");
    await user.click(screen.getByRole("button", { name: "Create Order" }));

    await waitFor(() => {
      expect(mutate).toHaveBeenCalledWith(
        {
          customerName: "Acme Corp",
          productType: "Widget A",
          quantity: 5,
          notes: "",
          pipelineId: "pipeline-abc",
        },
        expect.any(Object),
      );
    });
  });

  it("should call onOrderCreated with the returned order on success", async () => {
    const onOrderCreated = vi.fn();
    const mutate = vi.fn().mockImplementation((_values, options) => {
      options.onSuccess(sampleOrder);
    });
    vi.mocked(useCreateOrder).mockReturnValue({
      mutate,
      isPending: false,
      error: null,
    } as unknown as ReturnType<typeof useCreateOrder>);

    const user = userEvent.setup();
    render(<OrderForm onOrderCreated={onOrderCreated} />, {
      wrapper: createWrapper(),
    });

    await user.type(screen.getByLabelText("Customer Name"), "Acme Corp");
    await user.type(screen.getByLabelText("Product Type"), "Widget A");
    await user.clear(screen.getByLabelText("Quantity"));
    await user.type(screen.getByLabelText("Quantity"), "5");
    await user.selectOptions(screen.getByLabelText("Pipeline"), "pipeline-abc");
    await user.click(screen.getByRole("button", { name: "Create Order" }));

    await waitFor(() => {
      expect(onOrderCreated).toHaveBeenCalledWith(sampleOrder);
    });
  });
});
