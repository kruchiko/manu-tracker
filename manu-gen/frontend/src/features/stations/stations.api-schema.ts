import { z } from "zod";

/**
 * Missing or non-finite slotCapacity defaults to 1 so a newer FE can run against an older API.
 * Values outside 1–15 also fall back to 1 (lenient parse); the server remains authoritative on writes.
 */
const slotCapacityFromApi = z.preprocess((val) => {
  if (val === undefined || val === null) {
    return 1;
  }
  if (typeof val === "number" && Number.isFinite(val)) {
    const n = Math.trunc(val);
    if (n >= 1 && n <= 15) {
      return n;
    }
  }
  return 1;
}, z.number().int().min(1).max(15));

export const stationSchema = z.object({
  id: z.string(),
  name: z.string(),
  location: z.string(),
  eyeId: z.string().nullable(),
  slotCapacity: slotCapacityFromApi,
});

export const stationListSchema = z.array(stationSchema);
