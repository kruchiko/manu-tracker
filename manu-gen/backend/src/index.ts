import express from "express";
import cors from "cors";
import { ordersRouter } from "./features/orders/orders.controller.js";
import { errorHandler } from "./shared/middleware/error-handler.js";

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/orders", ordersRouter);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`manu-gen backend listening on http://localhost:${PORT}`);
});
