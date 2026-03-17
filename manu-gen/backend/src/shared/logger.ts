type Level = "info" | "warn" | "error";

function write(level: Level, msg: string, context?: Record<string, unknown>): void {
  const entry = JSON.stringify({ time: new Date().toISOString(), level, msg, ...context });
  if (level === "error") {
    process.stderr.write(entry + "\n");
  } else {
    process.stdout.write(entry + "\n");
  }
}

export const logger = {
  info: (msg: string, context?: Record<string, unknown>) => write("info", msg, context),
  warn: (msg: string, context?: Record<string, unknown>) => write("warn", msg, context),
  error: (msg: string, context?: Record<string, unknown>) => write("error", msg, context),
};
