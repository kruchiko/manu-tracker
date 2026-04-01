import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient } from "@tanstack/react-query";
import { vi } from "vitest";
import { createWrapper } from "../../../test-utils";
import { useRemoveAllocation } from "./useRemoveAllocation";

vi.mock("../../../shared/api/client", () => ({
  apiClient: {
    delete: vi.fn(),
  },
}));

import { apiClient } from "../../../shared/api/client";

describe("useRemoveAllocation", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should call DELETE /jobs/:jobId/allocations/:allocationId", async () => {
    vi.mocked(apiClient.delete).mockResolvedValue(undefined);

    const { result } = renderHook(() => useRemoveAllocation(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ jobId: 5, allocationId: 12 });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(apiClient.delete).toHaveBeenCalledWith("/jobs/5/allocations/12");
  });

  it("should invalidate customer-orders and jobs queries on success", async () => {
    vi.mocked(apiClient.delete).mockResolvedValue(undefined);

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: Infinity } },
    });
    queryClient.setQueryData(["customer-orders"], []);
    queryClient.setQueryData(["jobs"], []);

    const { result } = renderHook(() => useRemoveAllocation(), {
      wrapper: createWrapper(queryClient),
    });

    result.current.mutate({ jobId: 1, allocationId: 1 });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(queryClient.getQueryState(["customer-orders"])?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(["jobs"])?.isInvalidated).toBe(true);
  });
});
