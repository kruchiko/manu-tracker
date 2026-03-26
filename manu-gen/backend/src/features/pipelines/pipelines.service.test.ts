import { describe, it, expect, beforeEach } from "vitest";
import db from "../../db.js";
import { AppError } from "../../shared/errors/app-error.js";
import * as pipelinesService from "./pipelines.service.js";
import * as stationsService from "../stations/stations.service.js";
import * as ordersService from "../orders/orders.service.js";

let stationId: string;

beforeEach(() => {
  db.exec("DELETE FROM tracking_events");
  db.exec("DELETE FROM orders");
  db.exec("DELETE FROM pipeline_steps");
  db.exec("DELETE FROM pipelines");
  db.exec("DELETE FROM stations");

  stationId = stationsService.createStation({ name: "Test Station" }).id;
});

describe("createPipeline", () => {
  it("should create a pipeline with steps", () => {
    const pipeline = pipelinesService.createPipeline({
      name: "Flow A",
      steps: [{ stationId, maxDurationSeconds: 120 }],
    });

    expect(pipeline.id).toMatch(/^pipeline-/);
    expect(pipeline.name).toBe("Flow A");
    expect(pipeline.steps).toHaveLength(1);
    expect(pipeline.steps[0].stationId).toBe(stationId);
    expect(pipeline.steps[0].maxDurationSeconds).toBe(120);
  });

  it("should default description to empty string", () => {
    const pipeline = pipelinesService.createPipeline({
      name: "Flow B",
      steps: [{ stationId, maxDurationSeconds: null }],
    });

    expect(pipeline.description).toBe("");
  });

  it("should compute totalExpectedSeconds when all steps have durations", () => {
    const s2 = stationsService.createStation({ name: "Station 2" });
    const pipeline = pipelinesService.createPipeline({
      name: "Timed",
      steps: [
        { stationId, maxDurationSeconds: 60 },
        { stationId: s2.id, maxDurationSeconds: 90 },
      ],
    });

    expect(pipeline.totalExpectedSeconds).toBe(150);
  });

  it("should set totalExpectedSeconds to null when any step lacks a duration", () => {
    const s2 = stationsService.createStation({ name: "Station 2" });
    const pipeline = pipelinesService.createPipeline({
      name: "Partial",
      steps: [
        { stationId, maxDurationSeconds: 60 },
        { stationId: s2.id, maxDurationSeconds: null },
      ],
    });

    expect(pipeline.totalExpectedSeconds).toBeNull();
  });
});

describe("getPipelineById", () => {
  it("should return the pipeline when it exists", () => {
    const created = pipelinesService.createPipeline({
      name: "Flow",
      steps: [{ stationId, maxDurationSeconds: null }],
    });
    const found = pipelinesService.getPipelineById(created.id);

    expect(found.id).toBe(created.id);
    expect(found.name).toBe("Flow");
  });

  it("should throw 404 when pipeline does not exist", () => {
    expect(() => pipelinesService.getPipelineById("nonexistent")).toThrow(
      expect.objectContaining({ statusCode: 404 }),
    );
  });
});

describe("listPipelines", () => {
  it("should return pipelines ordered by name", () => {
    pipelinesService.createPipeline({ name: "Zeta", steps: [{ stationId, maxDurationSeconds: null }] });
    pipelinesService.createPipeline({ name: "Alpha", steps: [{ stationId, maxDurationSeconds: null }] });

    const list = pipelinesService.listPipelines();

    expect(list).toHaveLength(2);
    expect(list[0].name).toBe("Alpha");
    expect(list[1].name).toBe("Zeta");
  });

  it("should respect limit and offset", () => {
    pipelinesService.createPipeline({ name: "A", steps: [{ stationId, maxDurationSeconds: null }] });
    pipelinesService.createPipeline({ name: "B", steps: [{ stationId, maxDurationSeconds: null }] });
    pipelinesService.createPipeline({ name: "C", steps: [{ stationId, maxDurationSeconds: null }] });

    const page = pipelinesService.listPipelines({ limit: 1, offset: 1 });

    expect(page).toHaveLength(1);
    expect(page[0].name).toBe("B");
  });
});

describe("deletePipeline", () => {
  it("should delete a pipeline with no orders", () => {
    const pipeline = pipelinesService.createPipeline({
      name: "Disposable",
      steps: [{ stationId, maxDurationSeconds: null }],
    });

    pipelinesService.deletePipeline(pipeline.id);

    expect(() => pipelinesService.getPipelineById(pipeline.id)).toThrow(
      expect.objectContaining({ statusCode: 404 }),
    );
  });

  it("should reject deletion when orders reference the pipeline", () => {
    const pipeline = pipelinesService.createPipeline({
      name: "In Use",
      steps: [{ stationId, maxDurationSeconds: null }],
    });

    ordersService.createOrder({
      customerName: "Acme",
      productType: "Widget",
      quantity: 1,
      notes: "",
      pipelineId: pipeline.id,
    });

    expect(() => pipelinesService.deletePipeline(pipeline.id)).toThrow(
      expect.objectContaining({ statusCode: 409 }),
    );

    const found = pipelinesService.getPipelineById(pipeline.id);
    expect(found.id).toBe(pipeline.id);
  });

  it("should throw 404 when pipeline does not exist", () => {
    expect(() => pipelinesService.deletePipeline("nonexistent")).toThrow(
      expect.objectContaining({ statusCode: 404 }),
    );
  });
});

describe("replaceSteps", () => {
  it("should replace all steps in a pipeline", () => {
    const s2 = stationsService.createStation({ name: "Station 2" });
    const pipeline = pipelinesService.createPipeline({
      name: "Flow",
      steps: [{ stationId, maxDurationSeconds: 60 }],
    });

    const updated = pipelinesService.replaceSteps(pipeline.id, {
      steps: [
        { stationId: s2.id, maxDurationSeconds: 120 },
      ],
    });

    expect(updated.steps).toHaveLength(1);
    expect(updated.steps[0].stationId).toBe(s2.id);
    expect(updated.steps[0].maxDurationSeconds).toBe(120);
  });
});
