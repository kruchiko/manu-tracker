import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient } from "@tanstack/react-query";
import { vi } from "vitest";
import { createWrapper } from "../../../test-utils";
import { useCreateStation } from "./useCreateStation";
import type { Station } from "../stations.types";

vi.mock("../../../shared/api/client", () => ({
  apiClient: {
    post: vi.fn(),
  },
}));

import { apiClient } from "../../../shared/api/client";

const sampleStation: Station = {
  id: "station-abc12345",
  name: "Polishing",
  location: "Floor 2",
  eyeId: null,
};

describe("useCreateStation", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should call POST /stations with the provided data", async () => {
    vi.mocked(apiClient.post).mockResolvedValue(sampleStation);

    const { result } = renderHook(() => useCreateStation(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ name: "Polishing", location: "Floor 2" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(apiClient.post).toHaveBeenCalledWith("/stations", {
      name: "Polishing",
      location: "Floor 2",
    });
  });

  it("should invalidate the stations query on success", async () => {
    vi.mocked(apiClient.post).mockResolvedValue(sampleStation);

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: Infinity } },
    });
    queryClient.setQueryData(["stations"], []);

    const { result } = renderHook(() => useCreateStation(), {
      wrapper: createWrapper(queryClient),
    });

    result.current.mutate({ name: "Polishing" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const queryState = queryClient.getQueryState(["stations"]);
    expect(queryState?.isInvalidated).toBe(true);
  });

  it("should expose the error on failure", async () => {
    vi.mocked(apiClient.post).mockRejectedValue(new Error("Server error"));

    const { result } = renderHook(() => useCreateStation(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ name: "Polishing" });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe("Server error");
  });
});
