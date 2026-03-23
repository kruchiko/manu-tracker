/** Normalize SQLite / scanner datetimes to ISO without a trailing Z (caller adds UTC Z if needed). */
export function toIso(raw: string): string {
  return raw.replace(" ", "T").replace(/Z$/, "");
}

export function parseUtcMs(raw: string): number {
  return new Date(toIso(raw) + "Z").getTime();
}
