"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { sanitizeValue } = require("./security.cjs");

function serializeError(error) {
  if (!error) return null;
  if (error instanceof Error) return sanitizeValue({ name: error.name, message: error.message, stack: error.stack || null });
  return { message: String(error) };
}

function createLogger(logDirectory, options = {}) {
  const maxLogBytes = Math.max(512 * 1024, Number(options.maxLogBytes || 5 * 1024 * 1024));
  const maxArchives = Math.max(1, Math.min(20, Number(options.maxArchives || 5)));
  const retentionDays = Math.max(1, Math.min(365, Number(options.retentionDays || 14)));
  fs.mkdirSync(logDirectory, { recursive: true, mode: 0o700 });
  const logFile = path.join(logDirectory, "angelcare-desktop.log");

  function cleanupExpired() {
    try {
      const cutoff = Date.now() - retentionDays * 86_400_000;
      for (const entry of fs.readdirSync(logDirectory, { withFileTypes: true })) {
        if (!entry.isFile() || !entry.name.startsWith("angelcare-desktop.log.")) continue;
        const file = path.join(logDirectory, entry.name);
        if (fs.statSync(file).mtimeMs < cutoff) fs.rmSync(file, { force: true });
      }
    } catch {
      // Logging maintenance must never terminate the runtime.
    }
  }

  function rotateIfNeeded() {
    try {
      if (!fs.existsSync(logFile) || fs.statSync(logFile).size < maxLogBytes) return;
      const oldest = `${logFile}.${maxArchives}`;
      if (fs.existsSync(oldest)) fs.rmSync(oldest, { force: true });
      for (let index = maxArchives - 1; index >= 1; index -= 1) {
        const source = `${logFile}.${index}`;
        const target = `${logFile}.${index + 1}`;
        if (fs.existsSync(source)) fs.renameSync(source, target);
      }
      fs.renameSync(logFile, `${logFile}.1`);
    } catch {
      // Logging must never terminate the desktop runtime.
    }
  }

  function write(level, event, details = {}) {
    rotateIfNeeded();
    const safeDetails = sanitizeValue(details);
    const record = {
      timestamp: new Date().toISOString(),
      level,
      event: String(event || "runtime_event").slice(0, 180),
      ...safeDetails,
    };
    try {
      fs.appendFileSync(logFile, `${JSON.stringify(record)}\n`, { encoding: "utf8", mode: 0o600 });
    } catch {
      // Ignore secondary logging failures.
    }
    const output = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
    output(`[ANGELCARE Desktop] ${record.event}`, safeDetails);
  }

  cleanupExpired();

  return {
    info: (event, details) => write("info", event, details),
    warn: (event, details) => write("warn", event, details),
    error: (event, error, details = {}) => write("error", event, { ...details, error: serializeError(error) }),
    cleanupExpired,
    logDirectory,
    logFile,
  };
}

module.exports = { createLogger, serializeError };
