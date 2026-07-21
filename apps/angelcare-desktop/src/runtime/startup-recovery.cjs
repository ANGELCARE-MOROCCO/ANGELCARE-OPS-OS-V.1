"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { atomicWriteJson, readJson } = require("./config.cjs");

function createStartupRecoveryController({ app, logger, threshold = 3 }) {
  const statePath = path.join(app.getPath("userData"), "startup-recovery.json");
  const previous = readJson(statePath, {});
  const previousUnclean = previous.running === true;
  const uncleanLaunches = previousUnclean ? Math.min(20, Number(previous.uncleanLaunches || 0) + 1) : 0;
  let state = {
    running: true,
    startedAt: new Date().toISOString(),
    lastHealthyAt: previous.lastHealthyAt || null,
    lastCleanExitAt: previous.lastCleanExitAt || null,
    uncleanLaunches,
    safeMode: uncleanLaunches >= Math.max(2, Number(threshold || 3)),
    lastVersion: app.getVersion(),
  };
  atomicWriteJson(statePath, state);
  logger.info("startup_recovery_initialized", { previousUnclean, uncleanLaunches, safeMode: state.safeMode });

  function persist(patch = {}) {
    state = { ...state, ...patch };
    atomicWriteJson(statePath, state);
    return { ...state };
  }

  return {
    getState: () => ({ ...state }),
    markHealthy: () => persist({ running: true, lastHealthyAt: new Date().toISOString(), uncleanLaunches: 0, safeMode: false }),
    markCleanExit: () => persist({ running: false, lastCleanExitAt: new Date().toISOString(), uncleanLaunches: 0 }),
    clearSafeMode: () => persist({ safeMode: false, uncleanLaunches: 0 }),
  };
}

module.exports = { createStartupRecoveryController };
