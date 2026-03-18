import express, { type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import { ordersRouter } from "./features/orders/orders.controller.js";
import { stationsRouter } from "./features/stations/stations.controller.js";
import { eyesRouter } from "./features/eyes/eyes.controller.js";
import { eventsRouter } from "./features/events/events.controller.js";
import { errorHandler } from "./shared/middleware/error-handler.js";
import { logger } from "./shared/logger.js";

const CORS_ORIGIN = process.env.CORS_ORIGIN ?? "http://localhost:5173";

export const app = express();

app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json({ limit: "16kb" }));

app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on("finish", () => {
    logger.info("request", {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      ms: Date.now() - start,
    });
  });
  next();
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/orders", ordersRouter);
app.use("/stations", stationsRouter);
app.use("/eyes", eyesRouter);
app.use("/events", eventsRouter);
app.use(errorHandler);
