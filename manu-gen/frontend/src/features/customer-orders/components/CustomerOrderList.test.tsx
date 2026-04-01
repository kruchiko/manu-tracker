import { render, screen } from "@testing-library/react";
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

    expect(screen.getByText(/Loading/)).toBeInTheDocument();
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

    expect(screen.getByText(/Error:/)).toBeInTheDocument();
  });

  it("should show empty state", () => {
    vi.mocked(useCustomerOrders).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useCustomerOrders>);

    render(<CustomerOrderList selectedId={null} onSelect={vi.fn()} />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText(/No customer orders/)).toBeInTheDocument();
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
    expect(screen.getByText("Open")).toBeInTheDocument();
    expect(screen.getByText("50%")).toBeInTheDocument();
  });
});
