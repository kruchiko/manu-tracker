import { z } from "zod";

const slotCapacitySchema = z.coerce.number().int().min(1).max(15);

export const createStationSchema = z.object({
  name: z.string().min(1, "name is required"),
  location: z.string().optional().default(""),
  slotCapacity: slotCapacitySchema.optional(),
});

/** Pre-parse shape: callers may omit fields that Zod defaults (e.g. tests, service without controller). */
export type CreateStationInput = z.input<typeof createStationSchema>;

export const assignEyeSchema = z.object({
  eyeId: z.string().min(1, "eyeId is required"),
});

export type AssignEyeInput = z.infer<typeof assignEyeSchema>;

export const updateStationSchema = z.object({
  name: z.string().min(1, "name is required"),
  location: z.string().optional().default(""),
  slotCapacity: slotCapacitySchema.optional(),
});

export type UpdateStationInput = z.input<typeof updateStationSchema>;

export interface StationRow {
  id: string;
  name: string;
  location: string;
  eye_id: string | null;
  slot_capacity: number;
}

export interface Station {
  id: string;
  name: string;
  location: string;
  eyeId: string | null;
  slotCapacity: number;
}

export function toStation(row: StationRow): Station {
  return {
    id: row.id,
    name: row.name,
    location: row.location,
    eyeId: row.eye_id,
    slotCapacity: row.slot_capacity,
  };
}
