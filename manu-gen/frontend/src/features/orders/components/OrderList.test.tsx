import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OrderList } from "./OrderList";
import { vi } from "vitest";
import { createWrapper } from "../../../test-utils";
import type { Order } from "../orders.types";

vi.mock("../hooks/useOrders", () => ({ useOrders: vi.fn() }));

import { useOrders } from "../hooks/useOrders";

const sampleOrders: Order[] = [
  {
    id: 1,
    orderNumber: "ORD-0001",
    customerName: "Acme Corp",
    productType: "Widget A",
    quantity: 10,
    notes: "",
    trayCode: "TRAY-0001",
    createdAt: "2024-01-15T10:00:00Z",
  },
  {
    id: 2,
    orderNumber: "ORD-0002",
    customerName: "Globex",
    productType: "Gadget B",
    quantity: 5,
    notes: "",
    trayCode: "TRAY-0002",
    createdAt: "2024-01-16T11:00:00Z",
  },
];

describe("OrderList", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should show loading state", () => {
    vi.mocked(useOrders).mockReturnValue({
      isLoading: true,
      error: null,
      data: undefined,
    } as unknown as ReturnType<typeof useOrders>);

    render(<OrderList selectedOrderId={null} onSelectOrder={vi.fn()} />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText("Loading orders…")).toBeInTheDocument();
  });

  it("should show error message when fetch fails", () => {
    vi.mocked(useOrders).mockReturnValue({
      isLoading: false,
      error: new Error("Network error"),
      data: undefined,
    } as unknown as ReturnType<typeof useOrders>);

    render(<OrderList selectedOrderId={null} onSelectOrder={vi.fn()} />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText(/Network error/)).toBeInTheDocument();
  });

  it("should show empty state when there are no orders", () => {
    vi.mocked(useOrders).mockReturnValue({
      isLoading: false,
      error: null,
      data: [],
    } as unknown as ReturnType<typeof useOrders>);

    render(<OrderList selectedOrderId={null} onSelectOrder={vi.fn()} />, {
      wrapper: createWrapper(),
    });

    expect(
      screen.getByText("No orders yet. Create one above."),
    ).toBeInTheDocument();
  });

  it("should render order rows", () => {
    vi.mocked(useOrders).mockReturnValue({
      isLoading: false,
      error: null,
      data: sampleOrders,
    } as unknown as ReturnType<typeof useOrders>);

    render(<OrderList selectedOrderId={null} onSelectOrder={vi.fn()} />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText("ORD-0001")).toBeInTheDocument();
    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
    expect(screen.getByText("TRAY-0001")).toBeInTheDocument();
    expect(screen.getByText("ORD-0002")).toBeInTheDocument();
    expect(screen.getByText("Globex")).toBeInTheDocument();
  });

  it("should call onSelectOrder when a row is clicked", async () => {
    const onSelectOrder = vi.fn();
    vi.mocked(useOrders).mockReturnValue({
      isLoading: false,
      error: null,
      data: sampleOrders,
    } as unknown as ReturnType<typeof useOrders>);

    const user = userEvent.setup();
    render(
      <OrderList selectedOrderId={null} onSelectOrder={onSelectOrder} />,
      { wrapper: createWrapper() },
    );

    await user.click(screen.getByText("ORD-0001"));

    expect(onSelectOrder).toHaveBeenCalledWith(sampleOrders[0]);
  });

  it("should highlight the selected row", () => {
    vi.mocked(useOrders).mockReturnValue({
      isLoading: false,
      error: null,
      data: sampleOrders,
    } as unknown as ReturnType<typeof useOrders>);

    render(
      <OrderList selectedOrderId={1} onSelectOrder={vi.fn()} />,
      { wrapper: createWrapper() },
    );

    const selectedRow = screen.getByText("ORD-0001").closest("tr");
    const otherRow = screen.getByText("ORD-0002").closest("tr");

    expect(selectedRow).toHaveClass("bg-blue-50");
    expect(otherRow).not.toHaveClass("bg-blue-50");
  });

  it("should activate row on Enter key", async () => {
    const onSelectOrder = vi.fn();
    vi.mocked(useOrders).mockReturnValue({
      isLoading: false,
      error: null,
      data: sampleOrders,
    } as unknown as ReturnType<typeof useOrders>);

    const user = userEvent.setup();
    render(
      <OrderList selectedOrderId={null} onSelectOrder={onSelectOrder} />,
      { wrapper: createWrapper() },
    );

    screen.getByText("ORD-0001").closest("tr")?.focus();
    await user.keyboard("{Enter}");

    expect(onSelectOrder).toHaveBeenCalledWith(sampleOrders[0]);
  });
});
