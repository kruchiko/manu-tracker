/** Coerce UI / JSON quirks (NaN, empty) to a valid API slot count in 1–15. */
export function clampSlotCapacityForApi(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 1;
  }
  return Math.min(15, Math.max(1, Math.trunc(value)));
}
