import { Router } from "express";
import { ZodError } from "zod";
import { AppError } from "../../shared/errors/app-error.js";
import { zodToAppError } from "../../shared/validation.js";
import { createOrderSchema } from "./orders.schema.js";
import * as ordersService from "./orders.service.js";

const MAX_PAGE_SIZE = 100;

const MAX_TRAY_CODE_LENGTH = 50;

function parseOrderId(raw: string): number {
  const id = Number(raw);
  if (!Number.isInteger(id) || id < 1) {
    throw new AppError(400, "Order id must be a positive integer");
  }
  return id;
}

function parseTrayCode(raw: string): string {
  if (raw.length === 0 || raw.length > MAX_TRAY_CODE_LENGTH) {
    throw new AppError(400, `trayCode must be between 1 and ${MAX_TRAY_CODE_LENGTH} characters`);
  }
  return raw;
}

export const ordersRouter = Router();

ordersRouter.post("/", (req, res, next) => {
  try {
    const input = createOrderSchema.parse(req.body);
    const order = ordersService.createOrder(input);
    res.status(201).json(order);
  } catch (err) {
    if (err instanceof ZodError) {
      next(zodToAppError(err));
      return;
    }
    next(err);
  }
});

ordersRouter.get("/", (req, res, next) => {
  try {
    const limit = req.query.limit !== undefined ? Number(req.query.limit) : 50;
    const offset = req.query.offset !== undefined ? Number(req.query.offset) : 0;

    if (!Number.isInteger(limit) || limit < 1 || limit > MAX_PAGE_SIZE) {
      throw new AppError(400, `limit must be an integer between 1 and ${MAX_PAGE_SIZE}`);
    }
    if (!Number.isInteger(offset) || offset < 0) {
      throw new AppError(400, "offset must be a non-negative integer");
    }

    const orders = ordersService.listOrders({ limit, offset });
    res.json(orders);
  } catch (err) {
    next(err);
  }
});

ordersRouter.get("/board", (req, res, next) => {
  try {
    const board = ordersService.getOrderBoard();
    res.json(board);
  } catch (err) {
    next(err);
  }
});

ordersRouter.get("/:id", (req, res, next) => {
  try {
    const id = parseOrderId(req.params.id);
    const order = ordersService.getOrderById(id);
    res.json(order);
  } catch (err) {
    next(err);
  }
});

ordersRouter.get("/:id/history", (req, res, next) => {
  try {
    const id = parseOrderId(req.params.id);
    const history = ordersService.getOrderHistory(id);
    res.json(history);
  } catch (err) {
    next(err);
  }
});

ordersRouter.get("/:id/qr", async (req, res, next) => {
  try {
    const id = parseOrderId(req.params.id);
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
    const trayCode = parseTrayCode(req.params.trayCode);
    const order = ordersService.getOrderByTrayCode(trayCode);
    res.json(order);
  } catch (err) {
    next(err);
  }
});
