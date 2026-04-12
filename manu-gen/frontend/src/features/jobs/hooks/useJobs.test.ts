import { renderHook, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { createWrapper } from "../../../test-utils";
import { useJobs } from "./useJobs";
import type { Job } from "../jobs.types";

vi.mock("../../../shared/api/client", () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

import { apiClient } from "../../../shared/api/client";

const sampleJobs: Job[] = [
  {
    id: 1,
    jobNumber: "JOB-0001",
    productType: "Widget",
    quantity: 10,
    allocatedQuantity: 0,
    notes: "",
    trayCode: "TRAY-0001",
    createdAt: "2026-01-01T00:00:00.000Z",
    status: "pending",
    pipelineId: "pipeline-abc",
    pipelineName: "Test Pipeline",
  },
];

describe("useJobs", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should fetch jobs from GET /jobs", async () => {
    vi.mocked(apiClient.get).mockResolvedValue(sampleJobs);

    const { result } = renderHook(() => useJobs(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(apiClient.get).toHaveBeenCalledWith("/jobs?limit=100&offset=0");
    expect(result.current.data).toEqual(sampleJobs);
  });

  it("should pass custom limit and offset", async () => {
    vi.mocked(apiClient.get).mockResolvedValue([]);

    const { result } = renderHook(() => useJobs({ limit: 10, offset: 5 }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(apiClient.get).toHaveBeenCalledWith("/jobs?limit=10&offset=5");
  });

  it("should expose the error on failure", async () => {
    vi.mocked(apiClient.get).mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useJobs(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe("Network error");
  });

  it("should not call the API when enabled is false", async () => {
    renderHook(() => useJobs({ enabled: false }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(apiClient.get).not.toHaveBeenCalled());
  });
});
