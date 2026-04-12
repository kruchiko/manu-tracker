/** Matches `docs/design/v2/tokens` chart tokens — Recharts requires resolved colors for SVG fills. */
const CHART_FILLS = ["#1a5faa", "#5a8fd4", "#c45c1a", "#4a90a4"] as const;

export function chartFillForIndex(i: number): string {
  return CHART_FILLS[i % CHART_FILLS.length]!;
}

export function buildStationFillMap(stationNames: string[]): Map<string, string> {
  const unique = [...new Set(stationNames)];
  const map = new Map<string, string>();
  unique.forEach((name, i) => {
    map.set(name, chartFillForIndex(i));
  });
  return map;
}
