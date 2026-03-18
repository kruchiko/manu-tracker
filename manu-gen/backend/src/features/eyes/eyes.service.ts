import { AppError } from "../../shared/errors/app-error.js";
import type { RegisterEyeInput, RegisterEyeResponse } from "./eyes.schema.js";
import * as stationsService from "../stations/stations.service.js";

export function registerEye(input: RegisterEyeInput): RegisterEyeResponse {
  const station = stationsService.getStationByEyeId(input.eyeId);
  if (!station) {
    throw new AppError(404, `No station assigned to eye ${input.eyeId}`);
  }
  return {
    stationId: station.id,
    stationName: station.name,
  };
}
