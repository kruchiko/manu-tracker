/** Stable index 0..3 for chart token classes per station name (same ordering idea as dashboard palette). */
export function buildStationColorIndexMap(stationNames: string[]): Map<string, number> {
  const unique = [...new Set(stationNames)];
  const map = new Map<string, number>();
  unique.forEach((name, i) => {
    map.set(name, i % 4);
  });
  return map;
}
