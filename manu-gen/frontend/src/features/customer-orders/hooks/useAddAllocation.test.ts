import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient } from "@tanstack/react-query";
import { vi } from "vitest";
import { createWrapper } from "../../../test-utils";
import { useAddAllocation } from "./useAddAllocation";

vi.mock("../../../shared/api/client", () => ({
  apiClient: {
    post: vi.fn(),
  },
}));

import { apiClient } from "../../../shared/api/client";

describe("useAddAllocation", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should call POST /jobs/:jobId/allocations", async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ id: 1, jobId: 5, jobNumber: "JOB-0005", quantity: 10 });

    const { result } = renderHook(() => useAddAllocation(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ jobId: 5, orderLineId: 3, quantity: 10 });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(apiClient.post).toHaveBeenCalledWith("/jobs/5/allocations", {
      orderLineId: 3,
      quantity: 10,
    });
  });

  it("should invalidate customer-orders and jobs queries on success", async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ id: 1 });

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: Infinity } },
    });
    queryClient.setQueryData(["customer-orders"], []);
    queryClient.setQueryData(["jobs"], []);

    const { result } = renderHook(() => useAddAllocation(), {
      wrapper: createWrapper(queryClient),
    });

    result.current.mutate({ jobId: 1, orderLineId: 1, quantity: 5 });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(queryClient.getQueryState(["customer-orders"])?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(["jobs"])?.isInvalidated).toBe(true);
  });
});
