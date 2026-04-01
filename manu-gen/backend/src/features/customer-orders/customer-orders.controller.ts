import { Router } from "express";
import { ZodError } from "zod";
import { AppError } from "../../shared/errors/app-error.js";
import { zodToAppError } from "../../shared/validation.js";
import {
  createCustomerOrderSchema,
  updateCustomerOrderSchema,
} from "./customer-orders.schema.js";
import * as service from "./customer-orders.service.js";

const MAX_PAGE_SIZE = 100;

function parseId(raw: string): number {
  const id = Number(raw);
  if (!Number.isInteger(id) || id < 1) {
    throw new AppError(400, "id must be a positive integer");
  }
  return id;
}

export const customerOrdersRouter = Router();

customerOrdersRouter.post("/", (req, res, next) => {
  try {
    const input = createCustomerOrderSchema.parse(req.body);
    const order = service.createCustomerOrder(input);
    res.status(201).json(order);
  } catch (err) {
    if (err instanceof ZodError) {
      next(zodToAppError(err));
      return;
    }
    next(err);
  }
});

customerOrdersRouter.get("/", (req, res, next) => {
  try {
    const limit = req.query.limit !== undefined ? Number(req.query.limit) : 50;
    const offset = req.query.offset !== undefined ? Number(req.query.offset) : 0;

    if (!Number.isInteger(limit) || limit < 1 || limit > MAX_PAGE_SIZE) {
      throw new AppError(400, `limit must be an integer between 1 and ${MAX_PAGE_SIZE}`);
    }
    if (!Number.isInteger(offset) || offset < 0) {
      throw new AppError(400, "offset must be a non-negative integer");
    }

    const orders = service.listCustomerOrders({ limit, offset });
    res.json(orders);
  } catch (err) {
    next(err);
  }
});

customerOrdersRouter.get("/:id", (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    const order = service.getCustomerOrderById(id);
    res.json(order);
  } catch (err) {
    next(err);
  }
});

customerOrdersRouter.patch("/:id", (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    const input = updateCustomerOrderSchema.parse(req.body);
    const order = service.updateCustomerOrder(id, input);
    res.json(order);
  } catch (err) {
    if (err instanceof ZodError) {
      next(zodToAppError(err));
      return;
    }
    next(err);
  }
});

customerOrdersRouter.delete("/:id", (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    service.deleteCustomerOrder(id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});
