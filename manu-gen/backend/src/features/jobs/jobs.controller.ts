import { Router } from "express";
import { ZodError } from "zod";
import { AppError } from "../../shared/errors/app-error.js";
import { zodToAppError } from "../../shared/validation.js";
import { createJobSchema, createAllocationSchema } from "./jobs.schema.js";
import * as jobsService from "./jobs.service.js";

const MAX_PAGE_SIZE = 100;

const MAX_TRAY_CODE_LENGTH = 50;

function parseJobId(raw: string): number {
  const id = Number(raw);
  if (!Number.isInteger(id) || id < 1) {
    throw new AppError(400, "Job id must be a positive integer");
  }
  return id;
}

function parseTrayCode(raw: string): string {
  if (raw.length === 0 || raw.length > MAX_TRAY_CODE_LENGTH) {
    throw new AppError(400, `trayCode must be between 1 and ${MAX_TRAY_CODE_LENGTH} characters`);
  }
  return raw;
}

export const jobsRouter = Router();

jobsRouter.post("/", (req, res, next) => {
  try {
    const input = createJobSchema.parse(req.body);
    const job = jobsService.createJob(input);
    res.status(201).json(job);
  } catch (err) {
    if (err instanceof ZodError) {
      next(zodToAppError(err));
      return;
    }
    next(err);
  }
});

jobsRouter.get("/", (req, res, next) => {
  try {
    const limit = req.query.limit !== undefined ? Number(req.query.limit) : 50;
    const offset = req.query.offset !== undefined ? Number(req.query.offset) : 0;

    if (!Number.isInteger(limit) || limit < 1 || limit > MAX_PAGE_SIZE) {
      throw new AppError(400, `limit must be an integer between 1 and ${MAX_PAGE_SIZE}`);
    }
    if (!Number.isInteger(offset) || offset < 0) {
      throw new AppError(400, "offset must be a non-negative integer");
    }

    const jobs = jobsService.listJobs({ limit, offset });
    res.json(jobs);
  } catch (err) {
    next(err);
  }
});

jobsRouter.get("/board", (req, res, next) => {
  try {
    const board = jobsService.getJobBoard();
    res.json(board);
  } catch (err) {
    next(err);
  }
});

jobsRouter.get("/:id", (req, res, next) => {
  try {
    const id = parseJobId(req.params.id);
    const job = jobsService.getJobById(id);
    res.json(job);
  } catch (err) {
    next(err);
  }
});

jobsRouter.get("/:id/history", (req, res, next) => {
  try {
    const id = parseJobId(req.params.id);
    const history = jobsService.getJobHistory(id);
    res.json(history);
  } catch (err) {
    next(err);
  }
});

jobsRouter.get("/:id/qr", async (req, res, next) => {
  try {
    const id = parseJobId(req.params.id);
    const format = req.query.format === "dataurl" ? "dataurl" : "png";

    if (format === "dataurl") {
      const dataUrl = await jobsService.generateQrDataUrl(id);
      res.json({ qr: dataUrl });
    } else {
      const buffer = await jobsService.generateQrCode(id);
      res.set("Content-Type", "image/png");
      res.send(buffer);
    }
  } catch (err) {
    next(err);
  }
});

jobsRouter.get("/tray/:trayCode", (req, res, next) => {
  try {
    const trayCode = parseTrayCode(req.params.trayCode);
    const job = jobsService.getJobByTrayCode(trayCode);
    res.json(job);
  } catch (err) {
    next(err);
  }
});

jobsRouter.get("/:id/allocations", (req, res, next) => {
  try {
    const id = parseJobId(req.params.id);
    const allocations = jobsService.listAllocations(id);
    res.json(allocations);
  } catch (err) {
    next(err);
  }
});

jobsRouter.post("/:id/allocations", (req, res, next) => {
  try {
    const id = parseJobId(req.params.id);
    const input = createAllocationSchema.parse(req.body);
    const allocation = jobsService.addAllocation(id, input);
    res.status(201).json(allocation);
  } catch (err) {
    if (err instanceof ZodError) {
      next(zodToAppError(err));
      return;
    }
    next(err);
  }
});

jobsRouter.delete("/:id/allocations/:allocationId", (req, res, next) => {
  try {
    const id = parseJobId(req.params.id);
    const allocationId = Number(req.params.allocationId);
    if (!Number.isInteger(allocationId) || allocationId < 1) {
      throw new AppError(400, "allocationId must be a positive integer");
    }
    jobsService.removeAllocation(id, allocationId);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});
