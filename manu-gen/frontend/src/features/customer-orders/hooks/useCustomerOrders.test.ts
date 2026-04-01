import { renderHook, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { createWrapper } from "../../../test-utils";
import { useCustomerOrders } from "./useCustomerOrders";
import type { CustomerOrderSummary } from "../customer-orders.types";

vi.mock("../../../shared/api/client", () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

import { apiClient } from "../../../shared/api/client";

const sampleOrders: CustomerOrderSummary[] = [
  {
    id: 1,
    orderNumber: "CO-0001",
    customerName: "Acme Corp",
    status: "open",
    dueDate: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    lineCount: 2,
    allocationPct: 0,
    fulfillmentPct: 0,
  },
];

describe("useCustomerOrders", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should fetch customer orders from GET /customer-orders", async () => {
    vi.mocked(apiClient.get).mockResolvedValue(sampleOrders);

    const { result } = renderHook(() => useCustomerOrders(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(apiClient.get).toHaveBeenCalledWith("/customer-orders?limit=100");
    expect(result.current.data).toEqual(sampleOrders);
  });

  it("should expose the error on failure", async () => {
    vi.mocked(apiClient.get).mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useCustomerOrders(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe("Network error");
  });
});
