import { describe, expect, it } from "vitest";
import type { Job } from "../jobs.types";
import { filterJobsByTab } from "./jobListFilters";

const j = (status: Job["status"]): Job => ({
  id: 1,
  jobNumber: "J1",
  productType: "P",
  quantity: 1,
  allocatedQuantity: 0,
  notes: "",
  trayCode: "T",
  createdAt: "",
  pipelineId: "pl",
  pipelineName: "Pl",
  status,
});

describe("filterJobsByTab", () => {
  const jobs: Job[] = [j("pending"), { ...j("pending"), id: 2, status: "in_progress" }];

  it("returns all jobs when filter is all", () => {
    expect(filterJobsByTab(jobs, "all")).toHaveLength(2);
  });

  it("filters by status", () => {
    expect(filterJobsByTab(jobs, "pending")).toHaveLength(1);
    expect(filterJobsByTab(jobs, "pending")[0].status).toBe("pending");
    expect(filterJobsByTab(jobs, "completed")).toHaveLength(0);
  });
});
