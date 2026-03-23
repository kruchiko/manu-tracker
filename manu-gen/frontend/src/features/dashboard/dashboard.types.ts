export interface BoardOrder {
  id: number;
  orderNumber: string;
  customerName: string;
  productType: string;
  trayCode: string;
  createdAt: string;
  currentStation: { id: string; name: string } | null;
  lastSeenAt: string | null;
  stationArrivedAt: string | null;
}

export type OrderHistoryPhase = "arrived" | "departed" | "scan";

export interface OrderHistoryEntry {
  id: number;
  phase: OrderHistoryPhase;
  station: string;
  at: string;
  durationSeconds: number | null;
}

export interface StationDuration {
  stationId: string;
  stationName: string;
  avgSeconds: number;
  maxSeconds: number;
  orderCount: number;
}
