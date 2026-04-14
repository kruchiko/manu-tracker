import { describe, expect, it } from "vitest";
import { filteredEmptyHeadline, JOB_STATUS_LABEL, JOB_STATUS_FILTER_ORDER } from "./jobStatusLabels";

describe("jobStatusLabels", () => {
  it("derives filtered-empty headlines from tab labels", () => {
    const statuses = Object.keys(JOB_STATUS_LABEL) as (keyof typeof JOB_STATUS_LABEL)[];
    for (const s of statuses) {
      expect(filteredEmptyHeadline(s)).toBe(`No ${JOB_STATUS_LABEL[s]} jobs`);
    }
  });

  it("includes every JobStatus exactly once in filter order", () => {
    const labelKeys = Object.keys(JOB_STATUS_LABEL);
    const orderSet = new Set<string>(JOB_STATUS_FILTER_ORDER);

    expect(JOB_STATUS_FILTER_ORDER.length).toBe(labelKeys.length);
    expect(orderSet.size).toBe(JOB_STATUS_FILTER_ORDER.length);

    for (const s of labelKeys) {
      expect(orderSet.has(s)).toBe(true);
    }
  });
});
