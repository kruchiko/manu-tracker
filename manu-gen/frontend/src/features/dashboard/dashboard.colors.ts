const STATION_PALETTE = [
  "#3b82f6", // blue-500
  "#8b5cf6", // violet-500
  "#06b6d4", // cyan-500
  "#f59e0b", // amber-500
  "#10b981", // emerald-500
  "#ec4899", // pink-500
  "#6366f1", // indigo-500
  "#14b8a6", // teal-500
];

export function buildStationColorMap(stationNames: string[]): Map<string, string> {
  const unique = [...new Set(stationNames)];
  const map = new Map<string, string>();
  unique.forEach((name, i) => {
    map.set(name, STATION_PALETTE[i % STATION_PALETTE.length]);
  });
  return map;
}
