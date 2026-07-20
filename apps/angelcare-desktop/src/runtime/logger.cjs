"use strict";

const fs = require("node:fs");
const path = require("node:path");

const MAX_LOG_BYTES = 5 * 1024 * 1024;
const MAX_ARCHIVES = 3;

function serializeError(error) {
  if (!error) return null;
  if (error instanceof Error) {
    return { name: error.name, message: error.message, stack: error.stack || null };
  }
  return { message: String(error) };
}

function createLogger(logDirectory) {
  fs.mkdirSync(logDirectory, { recursive: true });
  const logFile = path.join(logDirectory, "angelcare-desktop.log");

  function rotateIfNeeded() {
    try {
      if (!fs.existsSync(logFile) || fs.statSync(logFile).size < MAX_LOG_BYTES) return;
      for (let index = MAX_ARCHIVES; index >= 1; index -= 1) {
        const source = index === 1 ? logFile : `${logFile}.${index - 1}`;
        const target = `${logFile}.${index}`;
        if (fs.existsSync(source)) fs.renameSync(source, target);
      }
    } catch {
      // Logging must never terminate the desktop runtime.
    }
  }

  function write(level, event, details = {}) {
    rotateIfNeeded();
    const record = {
      timestamp: new Date().toISOString(),
      level,
      event,
      ...details,
    };
    try {
      fs.appendFileSync(logFile, `${JSON.stringify(record)}\n`, "utf8");
    } catch {
      // Ignore secondary logging failures.
    }
    const output = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
    output(`[ANGELCARE Desktop] ${event}`, details);
  }

  return {
    info: (event, details) => write("info", event, details),
    warn: (event, details) => write("warn", event, details),
    error: (event, error, details = {}) => write("error", event, { ...details, error: serializeError(error) }),
    logFile,
  };
}

module.exports = { createLogger, serializeError };
