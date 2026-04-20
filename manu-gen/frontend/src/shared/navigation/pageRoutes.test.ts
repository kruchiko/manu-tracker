import { describe, expect, it } from "vitest";
import {
  DEFAULT_PAGE,
  JOB_DETAIL_RETURN_FROM_LIVE_OPS,
  JOB_DETAIL_RETURN_FROM_PARAM,
  JOB_NEW_SEGMENT,
  jobDetailPath,
  jobDetailUrlFromLiveOperations,
  jobNewPath,
  pagePath,
  parseJobsDetailJobIdFromPathname,
  parseJobsJobIdParam,
  pathnameToActivePageId,
  type PageId,
} from "./pageRoutes";

const liveOpsReturnSearch = `${JOB_DETAIL_RETURN_FROM_PARAM}=${JOB_DETAIL_RETURN_FROM_LIVE_OPS}`;

describe("pagePath", () => {
  it.each<[PageId, string]>([
    ["stations", "/stations"],
    ["live-operations", "/live-operations"],
    ["customer-orders", "/customer-orders"],
    ["jobs", "/jobs"],
    ["pipelines", "/pipelines"],
  ])("pagePath(%j) → %s", (id, expected) => {
    expect(pagePath(id)).toBe(expected);
  });
});

describe("jobDetailPath", () => {
  it("builds a path with the job id segment", () => {
    expect(jobDetailPath(42)).toBe("/jobs/42");
    expect(jobDetailPath(1)).toBe("/jobs/1");
  });
});

describe("jobNewPath", () => {
  it("uses the reserved new segment", () => {
    expect(jobNewPath()).toBe(`/jobs/${JOB_NEW_SEGMENT}`);
  });
});

describe("jobDetailUrlFromLiveOperations", () => {
  it("builds the jobs detail URL with return-from query", () => {
    expect(jobDetailUrlFromLiveOperations(42)).toBe(
      `/jobs/42?${liveOpsReturnSearch}`,
    );
  });
});

describe("parseJobsJobIdParam", () => {
  it("accepts positive integer strings", () => {
    expect(parseJobsJobIdParam("42")).toBe(42);
    expect(parseJobsJobIdParam("1")).toBe(1);
  });

  it("rejects non-numeric, zero, and unsafe values", () => {
    expect(parseJobsJobIdParam(undefined)).toBeNull();
    expect(parseJobsJobIdParam("")).toBeNull();
    expect(parseJobsJobIdParam("abc")).toBeNull();
    expect(parseJobsJobIdParam(JOB_NEW_SEGMENT)).toBeNull();
    expect(parseJobsJobIdParam("0")).toBeNull();
    expect(parseJobsJobIdParam("00")).toBeNull();
  });
});

describe("parseJobsDetailJobIdFromPathname", () => {
  it("parses only a single /jobs/:id segment", () => {
    expect(parseJobsDetailJobIdFromPathname("/jobs/7")).toBe(7);
    expect(parseJobsDetailJobIdFromPathname("/jobs/7/extra")).toBeNull();
    expect(parseJobsDetailJobIdFromPathname("/jobs")).toBeNull();
    expect(parseJobsDetailJobIdFromPathname(`/jobs/${JOB_NEW_SEGMENT}`)).toBeNull();
  });
});

describe("pathnameToActivePageId", () => {
  it("highlights live operations when a numeric job detail has return-from query", () => {
    expect(pathnameToActivePageId("/jobs/42", liveOpsReturnSearch)).toBe(
      "live-operations",
    );
  });

  it("does not highlight live operations for /jobs list with only return-from query", () => {
    expect(pathnameToActivePageId("/jobs", liveOpsReturnSearch)).toBe("jobs");
  });

  it("highlights jobs for job routes without return-from query", () => {
    expect(pathnameToActivePageId("/jobs/42", "")).toBe("jobs");
    expect(pathnameToActivePageId("/jobs", "")).toBe("jobs");
    expect(pathnameToActivePageId("/jobs/not-a-number", "")).toBe("jobs");
    expect(pathnameToActivePageId(jobNewPath(), "")).toBe("jobs");
  });

  it("maps all top-level paths", () => {
    expect(pathnameToActivePageId("/pipelines", "")).toBe("pipelines");
    expect(pathnameToActivePageId("/stations", "")).toBe("stations");
    expect(pathnameToActivePageId("/customer-orders", "")).toBe("customer-orders");
    expect(pathnameToActivePageId("/live-operations", "")).toBe("live-operations");
  });

  it("strips trailing slash before matching", () => {
    expect(pathnameToActivePageId("/pipelines/", "")).toBe("pipelines");
    expect(pathnameToActivePageId("/stations/", "")).toBe("stations");
  });

  it("returns DEFAULT_PAGE for unknown paths", () => {
    expect(pathnameToActivePageId("/unknown", "")).toBe(DEFAULT_PAGE);
    expect(pathnameToActivePageId("/", "")).toBe(DEFAULT_PAGE);
  });
});
