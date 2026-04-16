import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { createWrapper } from "../../../test-utils";
import { CustomerOrdersPage } from "./CustomerOrdersPage";

vi.mock("../../../shared/hooks/useOrderMetrics", () => ({
  useOrderMetrics: vi.fn(),
}));

vi.mock("./CustomerOrderList", () => ({
  CustomerOrderList: () => <div data-testid="order-list-stub" />,
}));

import { useOrderMetrics } from "../../../shared/hooks/useOrderMetrics";

describe("CustomerOrdersPage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should show loading skeleton for order metrics on list view", () => {
    vi.mocked(useOrderMetrics).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useOrderMetrics>);

    render(<CustomerOrdersPage />, { wrapper: createWrapper() });

    expect(screen.getByLabelText(/loading order metrics/i)).toBeInTheDocument();
  });

  it("should show error when order metrics fail", () => {
    vi.mocked(useOrderMetrics).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error("Network down"),
    } as unknown as ReturnType<typeof useOrderMetrics>);

    render(<CustomerOrdersPage />, { wrapper: createWrapper() });

    expect(screen.getByRole("alert")).toHaveTextContent(/Network down/);
  });

  it("should show metric values when loaded", () => {
    vi.mocked(useOrderMetrics).mockReturnValue({
      data: {
        totalOrders: 12,
        fulfilledOrders: 3,
        avgJobsPerOrder: 2.5,
        byProductType: [],
      },
      isLoading: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useOrderMetrics>);

    render(<CustomerOrdersPage />, { wrapper: createWrapper() });

    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("2.5")).toBeInTheDocument();
  });
});
