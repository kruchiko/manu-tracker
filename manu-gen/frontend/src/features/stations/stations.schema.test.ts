import { describe, it, expect } from "vitest";
import { createStationSchema } from "./stations.schema";

describe("createStationSchema", () => {
  it("rejects NaN slotCapacity", () => {
    const result = createStationSchema.safeParse({
      name: "Test",
      slotCapacity: Number.NaN,
    });
    expect(result.success).toBe(false);
  });
});
