import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../../app.js";
import db from "../../db.js";

beforeEach(() => {
  db.exec("DELETE FROM tracking_events");
  db.exec("DELETE FROM orders");
  db.exec("DELETE FROM pipeline_steps");
  db.exec("DELETE FROM pipelines");
  db.exec("DELETE FROM stations");
});

function createStationWithEye(eyeId: string): Promise<string> {
  return request(app)
    .post("/stations")
    .send({ name: "Test Station" })
    .then((res) => {
      const id = res.body.id as string;
      return request(app)
        .put(`/stations/${id}/eye`)
        .send({ eyeId })
        .then(() => id);
    });
}

describe("POST /eyes/register", () => {
  it("should return station info when eye is assigned", async () => {
    await createStationWithEye("eye-1");

    const res = await request(app).post("/eyes/register").send({ eyeId: "eye-1" });

    expect(res.status).toBe(200);
    expect(res.body.stationId).toMatch(/^station-/);
    expect(res.body.stationName).toBe("Test Station");
  });

  it("should return 404 when eye is not assigned", async () => {
    const res = await request(app).post("/eyes/register").send({ eyeId: "eye-unknown" });

    expect(res.status).toBe(404);
    expect(res.body.error).toContain("No station assigned");
  });

  it("should return 400 when eyeId is missing", async () => {
    const res = await request(app).post("/eyes/register").send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("eyeId");
  });

  it("should return 400 when eyeId is empty", async () => {
    const res = await request(app).post("/eyes/register").send({ eyeId: "" });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("eyeId");
  });
});
