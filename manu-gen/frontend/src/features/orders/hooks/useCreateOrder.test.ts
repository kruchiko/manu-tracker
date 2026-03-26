import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient } from "@tanstack/react-query";
import { vi } from "vitest";
import { createWrapper } from "../../../test-utils";
import { useCreateOrder } from "./useCreateOrder";
import type { Order } from "../orders.types";

vi.mock("../../../shared/api/client", () => ({
  apiClient: {
    post: vi.fn(),
  },
}));

import { apiClient } from "../../../shared/api/client";

const sampleOrder: Order = {
  id: 1,
  orderNumber: "ORD-0001",
  customerName: "Acme Corp",
  productType: "Widget A",
  quantity: 5,
  notes: "",
  trayCode: "TRAY-0001",
  pipelineId: "pipeline-abc",
  pipelineName: "Standard Flow",
  createdAt: "2024-01-01T00:00:00Z",
};

describe("useCreateOrder", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should call POST /orders with the provided data", async () => {
    vi.mocked(apiClient.post).mockResolvedValue(sampleOrder);

    const { result } = renderHook(() => useCreateOrder(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      customerName: "Acme Corp",
      productType: "Widget A",
      quantity: 5,
      pipelineId: "pipeline-abc",
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(apiClient.post).toHaveBeenCalledWith("/orders", {
      customerName: "Acme Corp",
      productType: "Widget A",
      quantity: 5,
      pipelineId: "pipeline-abc",
    });
  });

  it("should invalidate the orders query on success", async () => {
    vi.mocked(apiClient.post).mockResolvedValue(sampleOrder);

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: Infinity } },
    });
    queryClient.setQueryData(["orders", { limit: 100, offset: 0 }], []);

    const { result } = renderHook(() => useCreateOrder(), {
      wrapper: createWrapper(queryClient),
    });

    result.current.mutate({
      customerName: "Acme Corp",
      productType: "Widget A",
      quantity: 5,
      pipelineId: "pipeline-abc",
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const queryState = queryClient.getQueryState([
      "orders",
      { limit: 100, offset: 0 },
    ]);
    expect(queryState?.isInvalidated).toBe(true);
  });

  it("should expose the error on failure", async () => {
    vi.mocked(apiClient.post).mockRejectedValue(new Error("Server error"));

    const { result } = renderHook(() => useCreateOrder(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      customerName: "Acme Corp",
      productType: "Widget A",
      quantity: 5,
      pipelineId: "pipeline-abc",
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe("Server error");
  });
});
