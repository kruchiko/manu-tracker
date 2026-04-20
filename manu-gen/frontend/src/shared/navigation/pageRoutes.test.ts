import { describe, expect, it } from "vitest";
import {
  pagePath,
  parseJobsDetailJobIdFromPathname,
  parseJobsJobIdParam,
  pathnameToActivePageId,
} from "./pageRoutes";

describe("pagePath", () => {
  it("returns a leading slash path per PageId", () => {
    expect(pagePath("stations")).toBe("/stations");
    expect(pagePath("live-operations")).toBe("/live-operations");
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
  it("highlights live operations when a numeric job detail has from=live-operations", () => {
    expect(pathnameToActivePageId("/jobs/42", "from=live-operations")).toBe(
      "live-operations",
    );
  });

  it("does not highlight live operations for /jobs list with only from query", () => {
    expect(pathnameToActivePageId("/jobs", "from=live-operations")).toBe("jobs");
  });

  it("highlights jobs for job routes without from query", () => {
    expect(pathnameToActivePageId("/jobs/42", "")).toBe("jobs");
    expect(pathnameToActivePageId("/jobs", "")).toBe("jobs");
    expect(pathnameToActivePageId("/jobs/not-a-number", "")).toBe("jobs");
  });

  it("maps other top-level paths", () => {
    expect(pathnameToActivePageId("/pipelines", "")).toBe("pipelines");
    expect(pathnameToActivePageId("/unknown", "")).toBe("stations");
  });
});
