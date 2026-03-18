import { Router } from "express";
import { ZodError } from "zod";
import { zodToAppError } from "../../shared/validation.js";
import { registerEyeSchema } from "./eyes.schema.js";
import * as eyesService from "./eyes.service.js";

export const eyesRouter = Router();

eyesRouter.post("/register", (req, res, next) => {
  try {
    const input = registerEyeSchema.parse(req.body);
    const result = eyesService.registerEye(input);
    res.json(result);
  } catch (err) {
    if (err instanceof ZodError) {
      next(zodToAppError(err));
      return;
    }
    next(err);
  }
});
