import { describe, expect, it } from "vitest";
import { pagePath, pathnameToActivePageId } from "./pageRoutes";

describe("pagePath", () => {
  it("returns a leading slash path per PageId", () => {
    expect(pagePath("stations")).toBe("/stations");
    expect(pagePath("live-operations")).toBe("/live-operations");
  });
});

describe("pathnameToActivePageId", () => {
  it("highlights live operations when job opened from there", () => {
    expect(pathnameToActivePageId("/jobs/42", "from=live-operations")).toBe(
      "live-operations",
    );
  });

  it("highlights jobs for job routes without from query", () => {
    expect(pathnameToActivePageId("/jobs/42", "")).toBe("jobs");
    expect(pathnameToActivePageId("/jobs", "")).toBe("jobs");
  });

  it("maps other top-level paths", () => {
    expect(pathnameToActivePageId("/pipelines", "")).toBe("pipelines");
    expect(pathnameToActivePageId("/unknown", "")).toBe("stations");
  });
});
