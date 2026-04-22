import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../../app.js";
import db from "../../db.js";
import * as stationsService from "../stations/stations.service.js";

let stationId: string;

beforeEach(() => {
  db.exec("DELETE FROM tracking_events");
  db.exec("DELETE FROM job_allocations");
  db.exec("DELETE FROM order_lines");
  db.exec("DELETE FROM customer_orders");
  db.exec("DELETE FROM jobs");
  db.exec("DELETE FROM pipeline_steps");
  db.exec("DELETE FROM pipelines");
  db.exec("DELETE FROM stations");

  stationId = stationsService.createStation({ name: "Test Station" }).id;
});

describe("POST /pipelines", () => {
  it("should create a pipeline and return 201", async () => {
    const res = await request(app).post("/pipelines").send({
      name: "Flow A",
      productType: "Widget",
      steps: [{ stationId, maxDurationSeconds: 120 }],
    });

    expect(res.status).toBe(201);
    expect(res.body.id).toMatch(/^pipeline-/);
    expect(res.body.name).toBe("Flow A");
    expect(res.body.steps).toHaveLength(1);
  });

  it("should return 400 when name is missing", async () => {
    const res = await request(app).post("/pipelines").send({
      productType: "Widget",
      steps: [{ stationId }],
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("name");
  });

  it("should return 400 when steps is empty", async () => {
    const res = await request(app).post("/pipelines").send({
      name: "Empty",
      productType: "Widget",
      steps: [],
    });

    expect(res.status).toBe(400);
  });

  it("should return 400 when minDurationSeconds exceeds maxDurationSeconds", async () => {
    const res = await request(app).post("/pipelines").send({
      name: "Bad range",
      productType: "Widget",
      steps: [
        {
          stationId,
          minDurationSeconds: 600,
          maxDurationSeconds: 120,
        },
      ],
    });

    expect(res.status).toBe(400);
  });

  it("should return 400 when minCapacity exceeds maxCapacity", async () => {
    const res = await request(app).post("/pipelines").send({
      name: "Bad caps",
      productType: "Widget2",
      steps: [
        {
          stationId,
          minCapacity: 10,
          maxCapacity: 2,
        },
      ],
    });

    expect(res.status).toBe(400);
  });
});

describe("PUT /pipelines/:id/steps", () => {
  it("should persist min duration and min capacity on replace", async () => {
    const createRes = await request(app).post("/pipelines").send({
      name: "Replaceable",
      productType: "Widget",
      steps: [{ stationId, maxDurationSeconds: 60, maxCapacity: 5 }],
    });
    expect(createRes.status).toBe(201);
    const id = createRes.body.id as string;

    const res = await request(app)
      .put(`/pipelines/${id}/steps`)
      .send({
        steps: [
          {
            stationId,
            minDurationSeconds: 120,
            maxDurationSeconds: 600,
            minCapacity: 2,
            maxCapacity: 10,
          },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.steps).toHaveLength(1);
    expect(res.body.steps[0].minDurationSeconds).toBe(120);
    expect(res.body.steps[0].maxDurationSeconds).toBe(600);
    expect(res.body.steps[0].minCapacity).toBe(2);
    expect(res.body.steps[0].maxCapacity).toBe(10);
  });
});

describe("GET /pipelines", () => {
  it("should return empty array when no pipelines exist", async () => {
    const res = await request(app).get("/pipelines");

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe("PATCH /pipelines/:id", () => {
  it("should update pipeline metadata", async () => {
    const createRes = await request(app).post("/pipelines").send({
      name: "Original",
      productType: "Widget",
      description: "Old desc",
      steps: [{ stationId, maxDurationSeconds: 60 }],
    });
    expect(createRes.status).toBe(201);
    const id = createRes.body.id as string;

    const res = await request(app).patch(`/pipelines/${id}`).send({
      name: "Renamed",
      productType: "Widget",
      description: "New desc",
    });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Renamed");
    expect(res.body.description).toBe("New desc");
    expect(res.body.productType).toBe("Widget");
  });

  it("should return 400 when name is empty string", async () => {
    const createRes = await request(app).post("/pipelines").send({
      name: "X",
      productType: "Widget",
      steps: [{ stationId, maxDurationSeconds: 60 }],
    });
    const id = createRes.body.id as string;

    const res = await request(app).patch(`/pipelines/${id}`).send({ name: "" });

    expect(res.status).toBe(400);
  });
});

describe("GET /pipelines/:id", () => {
  it("should return the pipeline when it exists", async () => {
    const createRes = await request(app).post("/pipelines").send({
      name: "Flow",
      productType: "Widget",
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
  it("should delete a pipeline with no jobs and return 204", async () => {
    const createRes = await request(app).post("/pipelines").send({
      name: "Temp",
      productType: "Widget",
      steps: [{ stationId, maxDurationSeconds: null }],
    });
    const id = createRes.body.id;

    const res = await request(app).delete(`/pipelines/${id}`);

    expect(res.status).toBe(204);
  });

  it("should return 409 when pipeline has jobs", async () => {
    const createRes = await request(app).post("/pipelines").send({
      name: "Busy",
      productType: "Widget",
      steps: [{ stationId, maxDurationSeconds: null }],
    });
    const pipelineId = createRes.body.id;

    await request(app).post("/jobs").send({
      productType: "Widget",
      quantity: 1,
      pipelineId,
    });

    const res = await request(app).delete(`/pipelines/${pipelineId}`);

    expect(res.status).toBe(409);
    expect(res.body.error).toContain("job");
  });

  it("should return 404 when pipeline does not exist", async () => {
    const res = await request(app).delete("/pipelines/nonexistent");

    expect(res.status).toBe(404);
  });
});

describe("POST /jobs with nonexistent pipelineId", () => {
  it("should return 404 for unknown pipeline", async () => {
    const res = await request(app).post("/jobs").send({
      productType: "Widget",
      quantity: 1,
      pipelineId: "pipeline-does-not-exist",
    });

    expect(res.status).toBe(404);
    expect(res.body.error).toContain("not found");
  });
});
