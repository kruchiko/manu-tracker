import express from "express";
import cors from "cors";
import { ordersRouter } from "./features/orders/orders.controller.js";
import { errorHandler } from "./shared/middleware/error-handler.js";

const CORS_ORIGIN = process.env.CORS_ORIGIN ?? "http://localhost:5173";

export const app = express();

app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json({ limit: "16kb" }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/orders", ordersRouter);
app.use(errorHandler);
