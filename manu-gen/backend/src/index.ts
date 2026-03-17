import { app } from "./app.js";
import { logger } from "./shared/logger.js";
import db from "./db.js";

const PORT = process.env.PORT ?? 3000;

const server = app.listen(PORT, () => {
  logger.info("manu-gen backend started", { port: PORT });
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
