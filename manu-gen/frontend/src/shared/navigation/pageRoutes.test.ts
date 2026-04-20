import { describe, expect, it } from "vitest";
import {
  JOB_DETAIL_RETURN_FROM_LIVE_OPS,
  JOB_DETAIL_RETURN_FROM_PARAM,
  jobDetailUrlFromLiveOperations,
  pagePath,
  parseJobsDetailJobIdFromPathname,
  parseJobsJobIdParam,
  pathnameToActivePageId,
} from "./pageRoutes";

const liveOpsReturnSearch = `${JOB_DETAIL_RETURN_FROM_PARAM}=${JOB_DETAIL_RETURN_FROM_LIVE_OPS}`;

describe("pagePath", () => {
  it("returns a leading slash path per PageId", () => {
    expect(pagePath("stations")).toBe("/stations");
    expect(pagePath("live-operations")).toBe("/live-operations");
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
  });

  it("rejects non-numeric, zero, and unsafe values", () => {
    expect(parseJobsJobIdParam(undefined)).toBeNull();
    expect(parseJobsJobIdParam("")).toBeNull();
    expect(parseJobsJobIdParam("abc")).toBeNull();
    expect(parseJobsJobIdParam("0")).toBeNull();
    expect(parseJobsJobIdParam("00")).toBeNull();
  });
});

describe("parseJobsDetailJobIdFromPathname", () => {
  it("parses only a single /jobs/:id segment", () => {
    expect(parseJobsDetailJobIdFromPathname("/jobs/7")).toBe(7);
    expect(parseJobsDetailJobIdFromPathname("/jobs/7/extra")).toBeNull();
    expect(parseJobsDetailJobIdFromPathname("/jobs")).toBeNull();
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
  });

  it("maps other top-level paths", () => {
    expect(pathnameToActivePageId("/pipelines", "")).toBe("pipelines");
    expect(pathnameToActivePageId("/unknown", "")).toBe("stations");
  });
});
