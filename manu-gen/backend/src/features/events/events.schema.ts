import { z } from "zod";

export const eventPhaseSchema = z.enum(["arrived", "departed", "scan"]);

export const createEventSchema = z.object({
  trayCode: z.string().min(1, "trayCode is required"),
  stationId: z.string().min(1, "stationId is required"),
  eyeId: z.string().min(1, "eyeId is required"),
  capturedAt: z.iso.datetime({ message: "capturedAt must be a valid ISO 8601 datetime" }),
  phase: eventPhaseSchema.optional().default("scan"),
});

export type CreateEventInput = z.input<typeof createEventSchema>;

export interface TrackingEventRow {
  id: number;
  tray_code: string;
  station_id: string;
  eye_id: string;
  captured_at: string;
  received_at: string;
  phase: string;
}

export interface TrackingEvent {
  id: number;
  trayCode: string;
  stationId: string;
  eyeId: string;
  capturedAt: string;
  receivedAt: string;
  phase: "arrived" | "departed" | "scan";
}

export function toTrackingEvent(row: TrackingEventRow): TrackingEvent {
  const phase = row.phase === "arrived" || row.phase === "departed" ? row.phase : "scan";
  return {
    id: row.id,
    trayCode: row.tray_code,
    stationId: row.station_id,
    eyeId: row.eye_id,
    capturedAt: row.captured_at,
    receivedAt: row.received_at,
    phase,
  };
}
