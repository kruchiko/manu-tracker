import { z } from "zod";

export const createStationSchema = z.object({
  name: z.string().min(1, "Station name is required"),
  location: z.string().optional(),
  slotCapacity: z
    .number({ error: () => ({ message: "Enter a number between 1 and 15" }) })
    .finite("Enter a number between 1 and 15")
    .int("Enter a number between 1 and 15")
    .min(1, "Minimum 1 slot")
    .max(15, "Maximum 15 slots")
    .optional(),
  cameraId: z.string().optional(),
});

export type CreateStationFormValues = z.infer<typeof createStationSchema>;
