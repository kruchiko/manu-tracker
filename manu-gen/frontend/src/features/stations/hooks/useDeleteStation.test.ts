import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient } from "@tanstack/react-query";
import { vi } from "vitest";
import { createWrapper } from "../../../test-utils";
import { useDeleteStation } from "./useDeleteStation";

vi.mock("../../../shared/api/client", () => ({
  apiClient: {
    deleteNoContent: vi.fn(),
  },
}));

import { apiClient } from "../../../shared/api/client";

describe("useDeleteStation", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should call DELETE /stations/:id", async () => {
    vi.mocked(apiClient.deleteNoContent).mockResolvedValue(undefined);

    const { result } = renderHook(() => useDeleteStation(), {
      wrapper: createWrapper(),
    });

    result.current.mutate("station-abc12345");

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(apiClient.deleteNoContent).toHaveBeenCalledWith(
      "/stations/station-abc12345",
    );
  });

  it("should invalidate the stations query on success", async () => {
    vi.mocked(apiClient.deleteNoContent).mockResolvedValue(undefined);

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: Infinity } },
    });
    queryClient.setQueryData(["stations"], []);

    const { result } = renderHook(() => useDeleteStation(), {
      wrapper: createWrapper(queryClient),
    });

    result.current.mutate("station-abc12345");

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const queryState = queryClient.getQueryState(["stations"]);
    expect(queryState?.isInvalidated).toBe(true);
  });

  it("should expose the error on failure", async () => {
    vi.mocked(apiClient.deleteNoContent).mockRejectedValue(
      new Error("Cannot delete"),
    );

    const { result } = renderHook(() => useDeleteStation(), {
      wrapper: createWrapper(),
    });

    result.current.mutate("station-abc12345");

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe("Cannot delete");
  });
});
