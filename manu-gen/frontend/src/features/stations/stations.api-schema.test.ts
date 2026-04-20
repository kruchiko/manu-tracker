import { describe, it, expect } from "vitest";
import { stationSchema } from "./stations.api-schema";

describe("stationSchema", () => {
  it("defaults missing slotCapacity to 1 for older API payloads", () => {
    const parsed = stationSchema.parse({
      id: "station-1",
      name: "A",
      location: "",
      eyeId: null,
    });
    expect(parsed.slotCapacity).toBe(1);
  });

  it("defaults null slotCapacity to 1", () => {
    const parsed = stationSchema.parse({
      id: "station-1",
      name: "A",
      location: "",
      eyeId: null,
      slotCapacity: null,
    });
    expect(parsed.slotCapacity).toBe(1);
  });

  it("accepts valid slotCapacity", () => {
    const parsed = stationSchema.parse({
      id: "station-1",
      name: "A",
      location: "",
      eyeId: null,
      slotCapacity: 12,
    });
    expect(parsed.slotCapacity).toBe(12);
  });

  it("clamps out-of-range slotCapacity from API to 1", () => {
    const parsed = stationSchema.parse({
      id: "station-1",
      name: "A",
      location: "",
      eyeId: null,
      slotCapacity: 99,
    });
    expect(parsed.slotCapacity).toBe(1);
  });
});
