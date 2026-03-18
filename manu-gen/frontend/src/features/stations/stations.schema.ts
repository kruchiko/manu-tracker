import { z } from "zod";

export const createStationSchema = z.object({
  name: z.string().min(1, "Station name is required"),
  location: z.string().optional(),
});

export type CreateStationFormValues = z.infer<typeof createStationSchema>;
