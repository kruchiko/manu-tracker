import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { createWrapper } from "../../../test-utils";
import { CustomerOrderList } from "./CustomerOrderList";

vi.mock("../hooks/useCustomerOrders", () => ({
  useCustomerOrders: vi.fn(),
}));

import { useCustomerOrders } from "../hooks/useCustomerOrders";

const sampleOrders = [
  {
    id: 1,
    orderNumber: "CO-0001",
    customerName: "Acme Corp",
    status: "open",
    dueDate: "2026-06-15",
    createdAt: "2026-01-01T00:00:00.000Z",
    lineCount: 2,
    allocationPct: 50,
    fulfillmentPct: 25,
  },
];

describe("CustomerOrderList", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should show loading state", () => {
    vi.mocked(useCustomerOrders).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as unknown as ReturnType<typeof useCustomerOrders>);

    render(<CustomerOrderList selectedId={null} onSelect={vi.fn()} />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText(/Loading orders/)).toBeInTheDocument();
  });

  it("should show error state", () => {
    vi.mocked(useCustomerOrders).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error("Failed"),
    } as unknown as ReturnType<typeof useCustomerOrders>);

    render(<CustomerOrderList selectedId={null} onSelect={vi.fn()} />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText(/Failed to load customer orders/)).toBeInTheDocument();
  });

  it("should show empty state with icon, heading, and optional create CTA", async () => {
    vi.mocked(useCustomerOrders).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useCustomerOrders>);

    const onCreate = vi.fn();
    render(
      <CustomerOrderList selectedId={null} onSelect={vi.fn()} onCreateOrder={onCreate} />,
      {
        wrapper: createWrapper(),
      },
    );

    expect(screen.getByRole("heading", { name: /No customer orders yet/i })).toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "New Order" }));
    expect(onCreate).toHaveBeenCalledTimes(1);
  });

  it("should show filtered empty state and reset filter from CTA", async () => {
    vi.mocked(useCustomerOrders).mockReturnValue({
      data: [
        {
          id: 1,
          orderNumber: "CO-0001",
          customerName: "Acme Corp",
          status: "fulfilled",
          dueDate: "2026-06-15",
          createdAt: "2026-01-01T00:00:00.000Z",
          lineCount: 1,
          allocationPct: 100,
          fulfillmentPct: 100,
        },
      ],
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useCustomerOrders>);

    render(<CustomerOrderList selectedId={null} onSelect={vi.fn()} />, {
      wrapper: createWrapper(),
    });

    await userEvent.click(screen.getByRole("button", { name: "New" }));
    expect(screen.getByRole("heading", { name: /No new orders/i })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "View all orders" }));
    expect(screen.getByText("CO-0001")).toBeInTheDocument();
  });

  it("should render order rows", () => {
    vi.mocked(useCustomerOrders).mockReturnValue({
      data: sampleOrders,
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useCustomerOrders>);

    render(<CustomerOrderList selectedId={null} onSelect={vi.fn()} />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText("CO-0001")).toBeInTheDocument();
    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
    expect(screen.getByText("2 lines")).toBeInTheDocument();
    expect(screen.getByText("Open")).toBeInTheDocument();
    expect(screen.getByText("50%")).toBeInTheDocument();
  });
});
