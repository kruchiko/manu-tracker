import { ZodError } from "zod";
import { AppError } from "./errors/app-error.js";

export function zodToAppError(err: ZodError): AppError {
  const message = err.issues
    .map((e) => (e.path.length > 0 ? `${e.path.join(".")}: ${e.message}` : e.message))
    .join(", ");
  return new AppError(400, message);
}
