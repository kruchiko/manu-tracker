import { describe, it, expect, beforeEach } from "vitest";
import db from "../../db.js";
import * as stationsService from "../stations/stations.service.js";
import * as eventsService from "./events.service.js";

beforeEach(() => {
  db.exec("DELETE FROM tracking_events");
  db.exec("DELETE FROM stations");
  db.exec("DELETE FROM sqlite_sequence WHERE name = 'tracking_events'");
});

function createTestStation(): string {
  const station = stationsService.createStation({ name: "Test Station" });
  stationsService.assignEye(station.id, { eyeId: "eye-1" });
  return station.id;
}

describe("createEvent", () => {
  it("should insert a tracking event and return it", () => {
    const stationId = createTestStation();

    const event = eventsService.createEvent({
      trayCode: "TRAY-0001",
      stationId,
      eyeId: "eye-1",
      capturedAt: "2026-03-18T14:30:00.000Z",
    });

    expect(event.id).toBe(1);
    expect(event.trayCode).toBe("TRAY-0001");
    expect(event.stationId).toBe(stationId);
    expect(event.eyeId).toBe("eye-1");
    expect(event.capturedAt).toBe("2026-03-18T14:30:00.000Z");
    expect(event.receivedAt).toBeTruthy();
    expect(event.phase).toBe("scan");
  });

  it("should persist arrived phase", () => {
    const stationId = createTestStation();

    const event = eventsService.createEvent({
      trayCode: "TRAY-0001",
      stationId,
      eyeId: "eye-1",
      capturedAt: "2026-03-18T14:30:00.000Z",
      phase: "arrived",
    });

    expect(event.phase).toBe("arrived");
  });
});

describe("listEvents", () => {
  it("should return events in descending order", () => {
    const stationId = createTestStation();

    eventsService.createEvent({
      trayCode: "TRAY-0001",
      stationId,
      eyeId: "eye-1",
      capturedAt: "2026-03-18T14:30:00.000Z",
    });
    eventsService.createEvent({
      trayCode: "TRAY-0002",
      stationId,
      eyeId: "eye-1",
      capturedAt: "2026-03-18T14:31:00.000Z",
    });

    const events = eventsService.listEvents();

    expect(events).toHaveLength(2);
    expect(events[0].trayCode).toBe("TRAY-0002");
    expect(events[1].trayCode).toBe("TRAY-0001");
  });

  it("should respect limit and offset", () => {
    const stationId = createTestStation();

    for (let i = 1; i <= 3; i++) {
      eventsService.createEvent({
        trayCode: `TRAY-${String(i).padStart(4, "0")}`,
        stationId,
        eyeId: "eye-1",
        capturedAt: `2026-03-18T14:3${i}:00.000Z`,
      });
    }

    const page = eventsService.listEvents({ limit: 1, offset: 1 });

    expect(page).toHaveLength(1);
    expect(page[0].trayCode).toBe("TRAY-0002");
  });
});
