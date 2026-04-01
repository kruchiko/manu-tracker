import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient } from "@tanstack/react-query";
import { vi } from "vitest";
import { createWrapper } from "../../../test-utils";
import { useCreateJob } from "./useCreateJob";
import type { Job } from "../jobs.types";

vi.mock("../../../shared/api/client", () => ({
  apiClient: {
    post: vi.fn(),
  },
}));

import { apiClient } from "../../../shared/api/client";

const sampleJob: Job = {
  id: 1,
  jobNumber: "JOB-0001",
  productType: "Widget",
  quantity: 10,
  notes: "",
  trayCode: "TRAY-0001",
  createdAt: "2026-01-01T00:00:00.000Z",
  pipelineId: "pipeline-abc",
  pipelineName: "Test Pipeline",
};

describe("useCreateJob", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should call POST /jobs with the provided data", async () => {
    vi.mocked(apiClient.post).mockResolvedValue(sampleJob);

    const { result } = renderHook(() => useCreateJob(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      productType: "Widget",
      quantity: 10,
      pipelineId: "pipeline-abc",
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(apiClient.post).toHaveBeenCalledWith("/jobs", {
      productType: "Widget",
      quantity: 10,
      pipelineId: "pipeline-abc",
    });
  });

  it("should invalidate the jobs query on success", async () => {
    vi.mocked(apiClient.post).mockResolvedValue(sampleJob);

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: Infinity } },
    });
    queryClient.setQueryData(["jobs"], []);

    const { result } = renderHook(() => useCreateJob(), {
      wrapper: createWrapper(queryClient),
    });

    result.current.mutate({
      productType: "Widget",
      quantity: 10,
      pipelineId: "pipeline-abc",
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const queryState = queryClient.getQueryState(["jobs"]);
    expect(queryState?.isInvalidated).toBe(true);
  });

  it("should expose the error on failure", async () => {
    vi.mocked(apiClient.post).mockRejectedValue(new Error("Server error"));

    const { result } = renderHook(() => useCreateJob(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      productType: "Widget",
      quantity: 10,
      pipelineId: "pipeline-abc",
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe("Server error");
  });
});
