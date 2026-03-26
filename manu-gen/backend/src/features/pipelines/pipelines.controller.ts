import { Router } from "express";
import { ZodError } from "zod";
import { AppError } from "../../shared/errors/app-error.js";
import { zodToAppError } from "../../shared/validation.js";
import {
  createPipelineSchema,
  updatePipelineSchema,
  replacePipelineStepsSchema,
} from "./pipelines.schema.js";
import * as pipelinesService from "./pipelines.service.js";

const MAX_PAGE_SIZE = 100;
const MAX_ID_LENGTH = 50;

function parsePipelineId(raw: string): string {
  if (raw.length === 0 || raw.length > MAX_ID_LENGTH) {
    throw new AppError(400, `Pipeline id must be between 1 and ${MAX_ID_LENGTH} characters`);
  }
  return raw;
}

export const pipelinesRouter = Router();

pipelinesRouter.post("/", (req, res, next) => {
  try {
    const input = createPipelineSchema.parse(req.body);
    const pipeline = pipelinesService.createPipeline(input);
    res.status(201).json(pipeline);
  } catch (err) {
    if (err instanceof ZodError) {
      next(zodToAppError(err));
      return;
    }
    next(err);
  }
});

pipelinesRouter.get("/", (req, res, next) => {
  try {
    const limit = req.query.limit !== undefined ? Number(req.query.limit) : 50;
    const offset = req.query.offset !== undefined ? Number(req.query.offset) : 0;

    if (!Number.isInteger(limit) || limit < 1 || limit > MAX_PAGE_SIZE) {
      throw new AppError(400, `limit must be an integer between 1 and ${MAX_PAGE_SIZE}`);
    }
    if (!Number.isInteger(offset) || offset < 0) {
      throw new AppError(400, "offset must be a non-negative integer");
    }

    const pipelines = pipelinesService.listPipelines({ limit, offset });
    res.json(pipelines);
  } catch (err) {
    next(err);
  }
});

pipelinesRouter.get("/:id", (req, res, next) => {
  try {
    const id = parsePipelineId(req.params.id);
    const pipeline = pipelinesService.getPipelineById(id);
    res.json(pipeline);
  } catch (err) {
    next(err);
  }
});

pipelinesRouter.patch("/:id", (req, res, next) => {
  try {
    const id = parsePipelineId(req.params.id);
    const input = updatePipelineSchema.parse(req.body);
    const pipeline = pipelinesService.updatePipeline(id, input);
    res.json(pipeline);
  } catch (err) {
    if (err instanceof ZodError) {
      next(zodToAppError(err));
      return;
    }
    next(err);
  }
});

pipelinesRouter.put("/:id/steps", (req, res, next) => {
  try {
    const id = parsePipelineId(req.params.id);
    const input = replacePipelineStepsSchema.parse(req.body);
    const pipeline = pipelinesService.replaceSteps(id, input);
    res.json(pipeline);
  } catch (err) {
    if (err instanceof ZodError) {
      next(zodToAppError(err));
      return;
    }
    next(err);
  }
});

pipelinesRouter.delete("/:id", (req, res, next) => {
  try {
    const id = parsePipelineId(req.params.id);
    pipelinesService.deletePipeline(id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});
