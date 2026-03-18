export interface BoardOrder {
  id: number;
  orderNumber: string;
  customerName: string;
  productType: string;
  trayCode: string;
  createdAt: string;
  currentStation: { id: string; name: string } | null;
  lastSeenAt: string | null;
}

export interface OrderHistoryEntry {
  station: string;
  arrivedAt: string;
  durationSeconds: number | null;
}

export interface StationDuration {
  stationId: string;
  stationName: string;
  avgSeconds: number;
  maxSeconds: number;
  orderCount: number;
}
