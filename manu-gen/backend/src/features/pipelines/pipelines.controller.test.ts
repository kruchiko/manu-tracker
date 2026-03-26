import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../../app.js";
import db from "../../db.js";
import * as stationsService from "../stations/stations.service.js";

let stationId: string;

beforeEach(() => {
  db.exec("DELETE FROM tracking_events");
  db.exec("DELETE FROM orders");
  db.exec("DELETE FROM pipeline_steps");
  db.exec("DELETE FROM pipelines");
  db.exec("DELETE FROM stations");

  stationId = stationsService.createStation({ name: "Test Station" }).id;
});

describe("POST /pipelines", () => {
  it("should create a pipeline and return 201", async () => {
    const res = await request(app).post("/pipelines").send({
      name: "Flow A",
      steps: [{ stationId, maxDurationSeconds: 120 }],
    });

    expect(res.status).toBe(201);
    expect(res.body.id).toMatch(/^pipeline-/);
    expect(res.body.name).toBe("Flow A");
    expect(res.body.steps).toHaveLength(1);
  });

  it("should return 400 when name is missing", async () => {
    const res = await request(app).post("/pipelines").send({
      steps: [{ stationId }],
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("name");
  });

  it("should return 400 when steps is empty", async () => {
    const res = await request(app).post("/pipelines").send({
      name: "Empty",
      steps: [],
    });

    expect(res.status).toBe(400);
  });
});

describe("GET /pipelines", () => {
  it("should return empty array when no pipelines exist", async () => {
    const res = await request(app).get("/pipelines");

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe("GET /pipelines/:id", () => {
  it("should return the pipeline when it exists", async () => {
    const createRes = await request(app).post("/pipelines").send({
      name: "Flow",
      steps: [{ stationId, maxDurationSeconds: null }],
    });
    const id = createRes.body.id;

    const res = await request(app).get(`/pipelines/${id}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(id);
  });

  it("should return 404 when pipeline does not exist", async () => {
    const res = await request(app).get("/pipelines/nonexistent");

    expect(res.status).toBe(404);
  });
});

describe("DELETE /pipelines/:id", () => {
  it("should delete a pipeline with no orders and return 204", async () => {
    const createRes = await request(app).post("/pipelines").send({
      name: "Temp",
      steps: [{ stationId, maxDurationSeconds: null }],
    });
    const id = createRes.body.id;

    const res = await request(app).delete(`/pipelines/${id}`);

    expect(res.status).toBe(204);
  });

  it("should return 409 when pipeline has orders", async () => {
    const createRes = await request(app).post("/pipelines").send({
      name: "Busy",
      steps: [{ stationId, maxDurationSeconds: null }],
    });
    const pipelineId = createRes.body.id;

    await request(app).post("/orders").send({
      customerName: "Acme",
      productType: "Widget",
      quantity: 1,
      pipelineId,
    });

    const res = await request(app).delete(`/pipelines/${pipelineId}`);

    expect(res.status).toBe(409);
    expect(res.body.error).toContain("order");
  });

  it("should return 404 when pipeline does not exist", async () => {
    const res = await request(app).delete("/pipelines/nonexistent");

    expect(res.status).toBe(404);
  });
});

describe("POST /orders with nonexistent pipelineId", () => {
  it("should return 400 for FK violation", async () => {
    const res = await request(app).post("/orders").send({
      customerName: "Acme",
      productType: "Widget",
      quantity: 1,
      pipelineId: "pipeline-does-not-exist",
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("does not exist");
  });
});
