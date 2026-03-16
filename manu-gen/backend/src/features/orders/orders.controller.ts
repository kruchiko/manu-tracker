import { Router } from "express";
import { AppError } from "../../shared/errors/app-error.js";
import { createOrderSchema } from "./orders.schema.js";
import * as ordersService from "./orders.service.js";

export const ordersRouter = Router();

ordersRouter.post("/", (req, res, next) => {
  try {
    const input = createOrderSchema.parse(req.body);
    const order = ordersService.createOrder(input);
    res.status(201).json(order);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") {
      next(new AppError(400, err.message));
      return;
    }
    next(err);
  }
});

ordersRouter.get("/", (_req, res) => {
  const orders = ordersService.listOrders();
  res.json(orders);
});

ordersRouter.get("/:id", (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      throw new AppError(400, "Order id must be a number");
    }
    const order = ordersService.getOrderById(id);
    res.json(order);
  } catch (err) {
    next(err);
  }
});

ordersRouter.get("/:id/qr", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      throw new AppError(400, "Order id must be a number");
    }

    const format = req.query.format === "dataurl" ? "dataurl" : "png";

    if (format === "dataurl") {
      const dataUrl = await ordersService.generateQrDataUrl(id);
      res.json({ qr: dataUrl });
    } else {
      const buffer = await ordersService.generateQrCode(id);
      res.set("Content-Type", "image/png");
      res.send(buffer);
    }
  } catch (err) {
    next(err);
  }
});

ordersRouter.get("/tray/:trayCode", (req, res, next) => {
  try {
    const order = ordersService.getOrderByTrayCode(req.params.trayCode);
    res.json(order);
  } catch (err) {
    next(err);
  }
});
