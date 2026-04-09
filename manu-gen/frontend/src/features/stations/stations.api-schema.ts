import { z } from "zod";

export const stationSchema = z.object({
  id: z.string(),
  name: z.string(),
  location: z.string(),
  eyeId: z.string().nullable(),
  slotCapacity: z.number().int().optional(),
});

export const stationListSchema = z.array(stationSchema);
