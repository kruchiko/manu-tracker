export interface StationDurationRow {
  station_id: string;
  station_name: string;
  avg_seconds: number;
  max_seconds: number;
  min_seconds: number;
  median_seconds: number;
  p95_seconds: number;
  order_count: number;
}

export interface StationDuration {
  stationId: string;
  stationName: string;
  avgSeconds: number;
  maxSeconds: number;
  minSeconds: number;
  medianSeconds: number;
  p95Seconds: number;
  orderCount: number;
}

export function toStationDuration(row: StationDurationRow): StationDuration {
  return {
    stationId: row.station_id,
    stationName: row.station_name,
    avgSeconds: Math.round(row.avg_seconds),
    maxSeconds: Math.round(row.max_seconds),
    minSeconds: Math.round(row.min_seconds),
    medianSeconds: Math.round(row.median_seconds),
    p95Seconds: Math.round(row.p95_seconds),
    orderCount: row.order_count,
  };
}

export interface DashboardSummary {
  activeOrders: number;
  totalTrackedOrders: number;
  avgDwellSeconds: number;
  bottleneckStation: string | null;
  thresholdViolations: number;
}

export interface HourlyActivityRow {
  station_id: string;
  station_name: string;
  hour: string;
  visit_count: number;
}

export interface HourlyBucket {
  hour: string;
  count: number;
}

export interface StationActivity {
  stationId: string;
  stationName: string;
  buckets: HourlyBucket[];
}
