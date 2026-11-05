type Level = "debug" | "info" | "warn" | "error";
type Fields = Record<string, unknown>;

const isDev = process.env.NODE_ENV !== "production";

function emit(level: Level, msg: string, fields?: Fields) {
  const entry = { level, msg, time: new Date().toISOString(), ...fields };
  if (isDev) {
    // Pretty in dev, structured JSON in prod (Vercel log drains parse JSON lines).
    const fn = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
    fn(`[${level}] ${msg}`, fields ?? "");
    return;
  }
  (level === "error" ? console.error : console.log)(JSON.stringify(entry));
}

export const logger = {
  debug: (msg: string, fields?: Fields) => isDev && emit("debug", msg, fields),
  info: (msg: string, fields?: Fields) => emit("info", msg, fields),
  warn: (msg: string, fields?: Fields) => emit("warn", msg, fields),
  error: (msg: string, fields?: Fields) => emit("error", msg, fields),
};
