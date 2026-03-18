export interface StationDurationRow {
  station_id: string;
  station_name: string;
  avg_seconds: number;
  max_seconds: number;
  order_count: number;
}

export interface StationDuration {
  stationId: string;
  stationName: string;
  avgSeconds: number;
  maxSeconds: number;
  orderCount: number;
}

export function toStationDuration(row: StationDurationRow): StationDuration {
  return {
    stationId: row.station_id,
    stationName: row.station_name,
    avgSeconds: Math.round(row.avg_seconds),
    maxSeconds: Math.round(row.max_seconds),
    orderCount: row.order_count,
  };
}
