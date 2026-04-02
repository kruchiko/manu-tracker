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

analyticsRouter.get("/summary", (req, res, next) => {
  try {
    const summary = analyticsService.getDashboardSummary();
    res.json(summary);
  } catch (err) {
    next(err);
  }
});

analyticsRouter.get("/activity", (req, res, next) => {
  try {
    const activity = analyticsService.getHourlyActivity();
    res.json(activity);
  } catch (err) {
    next(err);
  }
});

analyticsRouter.get("/order-metrics", (req, res, next) => {
  try {
    const metrics = analyticsService.getOrderMetrics();
    res.json(metrics);
  } catch (err) {
    next(err);
  }
});
