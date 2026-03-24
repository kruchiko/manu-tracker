import { z } from "zod";

export const createStationSchema = z.object({
  name: z.string().min(1, "name is required"),
  location: z.string().optional().default(""),
});

export type CreateStationInput = z.input<typeof createStationSchema>;

export const assignEyeSchema = z.object({
  eyeId: z.string().min(1, "eyeId is required"),
});

export type AssignEyeInput = z.input<typeof assignEyeSchema>;

export const updateStationSchema = z.object({
  maxDurationSeconds: z.number().int().min(1, "must be at least 1 second").nullable(),
});

export type UpdateStationInput = z.input<typeof updateStationSchema>;

export interface StationRow {
  id: string;
  name: string;
  location: string;
  eye_id: string | null;
  max_duration_seconds: number | null;
}

export interface Station {
  id: string;
  name: string;
  location: string;
  eyeId: string | null;
  maxDurationSeconds: number | null;
}

export function toStation(row: StationRow): Station {
  return {
    id: row.id,
    name: row.name,
    location: row.location,
    eyeId: row.eye_id,
    maxDurationSeconds: row.max_duration_seconds,
  };
}
