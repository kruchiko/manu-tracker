import { Router } from "express";
import { ZodError } from "zod";
import { AppError } from "../../shared/errors/app-error.js";
import { zodToAppError } from "../../shared/validation.js";
import { createEventSchema } from "./events.schema.js";
import * as eventsService from "./events.service.js";

const MAX_PAGE_SIZE = 100;

export const eventsRouter = Router();

eventsRouter.post("/", (req, res, next) => {
  try {
    const input = createEventSchema.parse(req.body);
    const event = eventsService.createEvent(input);
    res.status(201).json(event);
  } catch (err) {
    if (err instanceof ZodError) {
      next(zodToAppError(err));
      return;
    }
    next(err);
  }
});

eventsRouter.get("/", (req, res, next) => {
  try {
    const limit = req.query.limit !== undefined ? Number(req.query.limit) : 50;
    const offset = req.query.offset !== undefined ? Number(req.query.offset) : 0;

    if (!Number.isInteger(limit) || limit < 1 || limit > MAX_PAGE_SIZE) {
      throw new AppError(400, `limit must be an integer between 1 and ${MAX_PAGE_SIZE}`);
    }
    if (!Number.isInteger(offset) || offset < 0) {
      throw new AppError(400, "offset must be a non-negative integer");
    }

    const events = eventsService.listEvents({ limit, offset });
    res.json(events);
  } catch (err) {
    next(err);
  }
});
