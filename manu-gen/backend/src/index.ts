import { app } from "./app.js";
import { logger } from "./shared/logger.js";
import db from "./db.js";

const PORT = Number(process.env.PORT ?? 3000);
// 0.0.0.0: required for Docker host port publish; loopback-only breaks host curl while healthchecks pass.
const HOST = process.env.HOST ?? "0.0.0.0";

const server = app.listen(PORT, HOST, () => {
  logger.info("manu-gen backend started", { host: HOST, port: PORT });
});

function shutdown() {
  server.close(() => {
    db.close();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
