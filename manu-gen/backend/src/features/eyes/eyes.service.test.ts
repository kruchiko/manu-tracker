import { describe, it, expect, beforeEach } from "vitest";
import db from "../../db.js";
import * as stationsService from "../stations/stations.service.js";
import * as eyesService from "./eyes.service.js";

beforeEach(() => {
  db.exec("DELETE FROM tracking_events");
  db.exec("DELETE FROM orders");
  db.exec("DELETE FROM pipeline_steps");
  db.exec("DELETE FROM pipelines");
  db.exec("DELETE FROM stations");
});

describe("registerEye", () => {
  it("should return station info when eye is assigned", () => {
    const station = stationsService.createStation({ name: "Polishing", location: "Floor 2" });
    stationsService.assignEye(station.id, { eyeId: "eye-1" });

    const result = eyesService.registerEye({ eyeId: "eye-1" });

    expect(result.stationId).toBe(station.id);
    expect(result.stationName).toBe("Polishing");
  });

  it("should throw 404 when eye is not assigned to any station", () => {
    expect(() => eyesService.registerEye({ eyeId: "eye-unknown" })).toThrow("No station assigned");
  });
});
