import { z } from "zod";

export const registerEyeSchema = z.object({
  eyeId: z.string().min(1, "eyeId is required"),
  hostname: z.string().optional().default(""),
});

export type RegisterEyeInput = z.input<typeof registerEyeSchema>;

export interface RegisterEyeResponse {
  stationId: string;
  stationName: string;
}
