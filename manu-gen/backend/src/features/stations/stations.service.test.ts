import { describe, it, expect, beforeEach } from "vitest";
import db from "../../db.js";
import * as stationsService from "./stations.service.js";

beforeEach(() => {
  db.exec("DELETE FROM tracking_events");
  db.exec("DELETE FROM stations");
});

describe("createStation", () => {
  it("should create a station with generated id", () => {
    const station = stationsService.createStation({ name: "Polishing", location: "Floor 2" });

    expect(station.id).toMatch(/^station-/);
    expect(station.name).toBe("Polishing");
    expect(station.location).toBe("Floor 2");
    expect(station.eyeId).toBeNull();
  });

  it("should default location to empty string", () => {
    const station = stationsService.createStation({ name: "Casting" });

    expect(station.location).toBe("");
  });
});

describe("getStationById", () => {
  it("should return the station when it exists", () => {
    const created = stationsService.createStation({ name: "Glazing" });
    const found = stationsService.getStationById(created.id);

    expect(found).toEqual(created);
  });

  it("should throw 404 when station does not exist", () => {
    expect(() => stationsService.getStationById("nonexistent")).toThrow("not found");
  });
});

describe("listStations", () => {
  it("should return all stations ordered by name", () => {
    stationsService.createStation({ name: "Zirconia" });
    stationsService.createStation({ name: "Assembly" });

    const stations = stationsService.listStations();

    expect(stations).toHaveLength(2);
    expect(stations[0].name).toBe("Assembly");
    expect(stations[1].name).toBe("Zirconia");
  });

  it("should respect limit and offset", () => {
    stationsService.createStation({ name: "A" });
    stationsService.createStation({ name: "B" });
    stationsService.createStation({ name: "C" });

    const page = stationsService.listStations({ limit: 1, offset: 1 });

    expect(page).toHaveLength(1);
    expect(page[0].name).toBe("B");
  });
});

describe("assignEye", () => {
  it("should assign an eye to a station", () => {
    const station = stationsService.createStation({ name: "Casting" });
    const updated = stationsService.assignEye(station.id, { eyeId: "eye-1" });

    expect(updated.eyeId).toBe("eye-1");
  });

  it("should move eye from one station to another", () => {
    const s1 = stationsService.createStation({ name: "Station A" });
    const s2 = stationsService.createStation({ name: "Station B" });

    stationsService.assignEye(s1.id, { eyeId: "eye-1" });
    stationsService.assignEye(s2.id, { eyeId: "eye-1" });

    const refreshedS1 = stationsService.getStationById(s1.id);
    const refreshedS2 = stationsService.getStationById(s2.id);

    expect(refreshedS1.eyeId).toBeNull();
    expect(refreshedS2.eyeId).toBe("eye-1");
  });

  it("should throw 404 when station does not exist", () => {
    expect(() => stationsService.assignEye("nonexistent", { eyeId: "eye-1" })).toThrow("not found");
  });
});

describe("unassignEye", () => {
  it("should clear the eye from a station", () => {
    const station = stationsService.createStation({ name: "Casting" });
    stationsService.assignEye(station.id, { eyeId: "eye-1" });

    const updated = stationsService.unassignEye(station.id);

    expect(updated.eyeId).toBeNull();
  });

  it("should throw 400 when station has no eye assigned", () => {
    const station = stationsService.createStation({ name: "Casting" });

    expect(() => stationsService.unassignEye(station.id)).toThrow("no eye assigned");
  });

  it("should throw 404 when station does not exist", () => {
    expect(() => stationsService.unassignEye("nonexistent")).toThrow("not found");
  });
});

describe("deleteStation", () => {
  it("should delete a station with no events", () => {
    const station = stationsService.createStation({ name: "Casting" });

    stationsService.deleteStation(station.id);

    expect(() => stationsService.getStationById(station.id)).toThrow("not found");
  });

  it("should cascade-delete tracking events and the station", () => {
    const station = stationsService.createStation({ name: "Casting" });
    db.prepare(
      `INSERT INTO tracking_events (tray_code, station_id, eye_id, captured_at) VALUES (?, ?, ?, ?)`,
    ).run("TRAY-001", station.id, "eye-1", "2025-01-01T00:00:00Z");

    stationsService.deleteStation(station.id);

    expect(() => stationsService.getStationById(station.id)).toThrow("not found");
    const eventCount = db.prepare(
      "SELECT COUNT(*) AS cnt FROM tracking_events WHERE station_id = ?",
    ).get(station.id) as { cnt: number };
    expect(eventCount.cnt).toBe(0);
  });

  it("should unassign the eye before deleting", () => {
    const station = stationsService.createStation({ name: "Casting" });
    stationsService.assignEye(station.id, { eyeId: "eye-1" });

    stationsService.deleteStation(station.id);

    expect(() => stationsService.getStationById(station.id)).toThrow("not found");
    expect(stationsService.getStationByEyeId("eye-1")).toBeNull();
  });

  it("should throw 404 when station does not exist", () => {
    expect(() => stationsService.deleteStation("nonexistent")).toThrow("not found");
  });
});

describe("getStationByEyeId", () => {
  it("should return the station assigned to the eye", () => {
    const station = stationsService.createStation({ name: "Polishing" });
    stationsService.assignEye(station.id, { eyeId: "eye-42" });

    const found = stationsService.getStationByEyeId("eye-42");

    expect(found).not.toBeNull();
    expect(found!.id).toBe(station.id);
  });

  it("should return null when no station has the eye", () => {
    const found = stationsService.getStationByEyeId("eye-unknown");

    expect(found).toBeNull();
  });
});
