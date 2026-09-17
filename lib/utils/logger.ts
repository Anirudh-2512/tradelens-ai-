// Structured server-side logging (spec §48–49).
// NEVER log passwords, secrets, API keys, tokens, or sensitive user data.

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  event: string;
  endpoint?: string;
  requestId?: string;
  metadata?: Record<string, unknown>;
}

function write(
  level: LogLevel,
  event: string,
  endpoint?: string,
  metadata?: Record<string, unknown>
) {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    event,
    endpoint,
    metadata,
  };
  const line = JSON.stringify(entry);
  if (level === "error") console.error(line); // eslint-disable-line no-console
  else if (level === "warn") console.warn(line); // eslint-disable-line no-console
  else console.log(line); // eslint-disable-line no-console
}

export const logger = {
  debug: (event: string, endpoint?: string, metadata?: Record<string, unknown>) => {
    if (process.env.NODE_ENV !== "production") write("debug", event, endpoint, metadata);
  },
  info: (event: string, endpoint?: string, metadata?: Record<string, unknown>) =>
    write("info", event, endpoint, metadata),
  warn: (event: string, endpoint?: string, metadata?: Record<string, unknown>) =>
    write("warn", event, endpoint, metadata),
  error: (event: string, endpoint?: string, metadata?: Record<string, unknown>) =>
    write("error", event, endpoint, metadata),
};
