import { Router } from "express";
import * as analyticsService from "./analytics.service.js";

export const analyticsRouter = Router();

analyticsRouter.get("/durations", (req, res, next) => {
  try {
    const durations = analyticsService.getStationDurations();
    res.json(durations);
  } catch (err) {
    next(err);
  }
});
