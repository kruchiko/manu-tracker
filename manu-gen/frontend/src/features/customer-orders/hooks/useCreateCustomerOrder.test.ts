import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient } from "@tanstack/react-query";
import { vi } from "vitest";
import { createWrapper } from "../../../test-utils";
import { useCreateCustomerOrder } from "./useCreateCustomerOrder";
import type { CustomerOrder } from "../customer-orders.types";

vi.mock("../../../shared/api/client", () => ({
  apiClient: {
    post: vi.fn(),
  },
}));

import { apiClient } from "../../../shared/api/client";

const sampleOrder: CustomerOrder = {
  id: 1,
  orderNumber: "CO-0001",
  customerName: "Acme Corp",
  notes: "",
  status: "open",
  dueDate: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  lines: [{ id: 1, productType: "Widget", quantity: 10, allocatedQuantity: 0, fulfilledQuantity: 0, allocations: [] }],
  allocationPct: 0,
  fulfillmentPct: 0,
};

describe("useCreateCustomerOrder", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should call POST /customer-orders with the provided data", async () => {
    vi.mocked(apiClient.post).mockResolvedValue(sampleOrder);

    const { result } = renderHook(() => useCreateCustomerOrder(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      customerName: "Acme Corp",
      notes: "",
      dueDate: "",
      lines: [{ productType: "Widget", quantity: 10 }],
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(apiClient.post).toHaveBeenCalledWith("/customer-orders", {
      customerName: "Acme Corp",
      notes: "",
      dueDate: null,
      lines: [{ productType: "Widget", quantity: 10 }],
    });
  });

  it("should invalidate the customer-orders query on success", async () => {
    vi.mocked(apiClient.post).mockResolvedValue(sampleOrder);

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: Infinity } },
    });
    queryClient.setQueryData(["customer-orders"], []);

    const { result } = renderHook(() => useCreateCustomerOrder(), {
      wrapper: createWrapper(queryClient),
    });

    result.current.mutate({
      customerName: "Acme Corp",
      notes: "",
      dueDate: "",
      lines: [{ productType: "Widget", quantity: 10 }],
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const queryState = queryClient.getQueryState(["customer-orders"]);
    expect(queryState?.isInvalidated).toBe(true);
  });

  it("should expose the error on failure", async () => {
    vi.mocked(apiClient.post).mockRejectedValue(new Error("Validation failed"));

    const { result } = renderHook(() => useCreateCustomerOrder(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      customerName: "Acme Corp",
      notes: "",
      dueDate: "",
      lines: [{ productType: "Widget", quantity: 10 }],
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe("Validation failed");
  });
});
