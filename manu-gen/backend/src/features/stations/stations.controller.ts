import { Router } from "express";
import { ZodError } from "zod";
import { AppError } from "../../shared/errors/app-error.js";
import { zodToAppError } from "../../shared/validation.js";
import { createStationSchema, assignEyeSchema } from "./stations.schema.js";
import * as stationsService from "./stations.service.js";

const MAX_PAGE_SIZE = 100;
const MAX_STATION_ID_LENGTH = 50;

function parseStationId(raw: string): string {
  if (raw.length === 0 || raw.length > MAX_STATION_ID_LENGTH) {
    throw new AppError(400, `Station id must be between 1 and ${MAX_STATION_ID_LENGTH} characters`);
  }
  return raw;
}

export const stationsRouter = Router();

stationsRouter.post("/", (req, res, next) => {
  try {
    const input = createStationSchema.parse(req.body);
    const station = stationsService.createStation(input);
    res.status(201).json(station);
  } catch (err) {
    if (err instanceof ZodError) {
      next(zodToAppError(err));
      return;
    }
    next(err);
  }
});

stationsRouter.get("/", (req, res, next) => {
  try {
    const limit = req.query.limit !== undefined ? Number(req.query.limit) : 50;
    const offset = req.query.offset !== undefined ? Number(req.query.offset) : 0;

    if (!Number.isInteger(limit) || limit < 1 || limit > MAX_PAGE_SIZE) {
      throw new AppError(400, `limit must be an integer between 1 and ${MAX_PAGE_SIZE}`);
    }
    if (!Number.isInteger(offset) || offset < 0) {
      throw new AppError(400, "offset must be a non-negative integer");
    }

    const stations = stationsService.listStations({ limit, offset });
    res.json(stations);
  } catch (err) {
    next(err);
  }
});

stationsRouter.get("/:id", (req, res, next) => {
  try {
    const id = parseStationId(req.params.id);
    const station = stationsService.getStationById(id);
    res.json(station);
  } catch (err) {
    next(err);
  }
});

stationsRouter.put("/:id/eye", (req, res, next) => {
  try {
    const id = parseStationId(req.params.id);
    const input = assignEyeSchema.parse(req.body);
    const station = stationsService.assignEye(id, input);
    res.json(station);
  } catch (err) {
    if (err instanceof ZodError) {
      next(zodToAppError(err));
      return;
    }
    next(err);
  }
});
