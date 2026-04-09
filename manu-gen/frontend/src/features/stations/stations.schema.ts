import { z } from "zod";

export const createStationSchema = z.object({
  name: z.string().min(1, "Station name is required"),
  location: z.string().optional(),
  slotCapacity: z.number().int().min(1).max(15, "Maximum 15 slots").optional(),
  cameraId: z.string().optional(),
});

export type CreateStationFormValues = z.infer<typeof createStationSchema>;
