"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { parseAllowedHosts, parseHttpUrl } = require("./url-policy.cjs");

function readJson(filePath, fallback = {}) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function atomicWriteJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const temporary = `${filePath}.tmp`;
  fs.writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
  fs.renameSync(temporary, filePath);
}

function loadRuntimeConfig({ app, defaultsPath }) {
  const defaults = readJson(defaultsPath);
  const configPath = path.join(app.getPath("userData"), "desktop-config.json");
  const persisted = readJson(configPath);
  const isDevelopment = process.env.NODE_ENV !== "production" || !app.isPackaged;
  const fallbackUrl = isDevelopment ? defaults.developmentAppUrl : defaults.productionAppUrl;
  const rawUrl = process.env.ANGELCARE_DESKTOP_APP_URL || persisted.appUrl || fallbackUrl;
  const appUrl = parseHttpUrl(rawUrl, { allowLocalHttp: isDevelopment });
  const allowedHosts = parseAllowedHosts(process.env.ANGELCARE_DESKTOP_ALLOWED_HOSTS, appUrl);

  const runtime = Object.freeze({
    appUrl: appUrl.href.replace(/\/$/, ""),
    appOrigin: appUrl.origin,
    allowedHosts,
    allowedExternalProtocols: defaults.allowedExternalProtocols,
    toolbarHeight: Number(defaults.toolbarHeight || 64),
    minimumWidth: Number(defaults.minimumWidth || 1120),
    minimumHeight: Number(defaults.minimumHeight || 720),
    defaultWidth: Number(persisted.window?.width || defaults.defaultWidth || 1540),
    defaultHeight: Number(persisted.window?.height || defaults.defaultHeight || 980),
    healthPath: String(defaults.healthPath || "/api/desktop/runtime/health"),
    healthCheckIntervalMs: Number(defaults.healthCheckIntervalMs || 30000),
    loadTimeoutMs: Number(defaults.loadTimeoutMs || 45000),
    desktopContractVersion: String(defaults.desktopContractVersion || "1.0.0"),
    releaseChannel: process.env.ANGELCARE_DESKTOP_RELEASE_CHANNEL || "stable",
    buildId: process.env.ANGELCARE_DESKTOP_BUILD_ID || "local",
    isDevelopment,
    configPath,
  });

  function persistWindowState(bounds, maximized) {
    atomicWriteJson(configPath, {
      appUrl: runtime.appUrl,
      window: {
        width: Math.max(runtime.minimumWidth, Number(bounds.width || runtime.defaultWidth)),
        height: Math.max(runtime.minimumHeight, Number(bounds.height || runtime.defaultHeight)),
        maximized: Boolean(maximized),
      },
      updatedAt: new Date().toISOString(),
    });
  }

  return { runtime, persisted, persistWindowState };
}

module.exports = { atomicWriteJson, loadRuntimeConfig, readJson };
