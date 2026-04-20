import { describe, it, expect } from "vitest";
import { clampSlotCapacityForApi } from "./slotCapacity.utils";

describe("clampSlotCapacityForApi", () => {
  it("returns 1 for non-finite values", () => {
    expect(clampSlotCapacityForApi(NaN)).toBe(1);
    expect(clampSlotCapacityForApi(undefined)).toBe(1);
    expect(clampSlotCapacityForApi("3")).toBe(1);
  });

  it("truncates and clamps to 1–15", () => {
    expect(clampSlotCapacityForApi(3.7)).toBe(3);
    expect(clampSlotCapacityForApi(0)).toBe(1);
    expect(clampSlotCapacityForApi(99)).toBe(15);
  });
});
