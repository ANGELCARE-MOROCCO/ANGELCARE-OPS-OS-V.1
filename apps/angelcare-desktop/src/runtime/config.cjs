"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { parseAllowedHosts, parseHttpUrl } = require("./url-policy.cjs");

function readJson(filePath, fallback = {}) {
  try { return JSON.parse(fs.readFileSync(filePath, "utf8")); } catch { return fallback; }
}

function atomicWriteJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true, mode: 0o700 });
  const temporary = `${filePath}.tmp`;
  fs.writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
  fs.renameSync(temporary, filePath);
}

function safePositive(value, fallback, minimum = 1, maximum = Number.MAX_SAFE_INTEGER) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(maximum, Math.max(minimum, parsed));
}

function normalizeHostList(values) {
  return [...new Set((Array.isArray(values) ? values : []).map((item) => String(item || "").trim().toLowerCase()).filter(Boolean))];
}

function loadRuntimeConfig({ app, defaultsPath }) {
  const defaults = readJson(defaultsPath);
  const configPath = path.join(app.getPath("userData"), "desktop-config.json");
  const persisted = readJson(configPath);
  const isDevelopment = !app.isPackaged || process.env.NODE_ENV === "development";
  const fallbackUrl = isDevelopment ? defaults.developmentAppUrl : defaults.productionAppUrl;
  const rawUrl = process.env.ANGELCARE_DESKTOP_APP_URL || (isDevelopment ? persisted.appUrl : null) || fallbackUrl;
  const appUrl = parseHttpUrl(rawUrl, { allowLocalHttp: isDevelopment });
  const allowedHosts = parseAllowedHosts(process.env.ANGELCARE_DESKTOP_ALLOWED_HOSTS, appUrl);
  const updateManifestUrl = String(process.env.ANGELCARE_DESKTOP_UPDATE_MANIFEST_URL || defaults.updateManifestUrl || "").trim();
  const updateAllowedHosts = normalizeHostList(String(process.env.ANGELCARE_DESKTOP_UPDATE_ALLOWED_HOSTS || "").split(",").filter(Boolean).length
    ? String(process.env.ANGELCARE_DESKTOP_UPDATE_ALLOWED_HOSTS).split(",")
    : defaults.updateAllowedHosts);
  if (updateManifestUrl) {
    try { updateAllowedHosts.push(new URL(updateManifestUrl).hostname.toLowerCase()); } catch { /* updater reports invalid URL explicitly */ }
  }

  const runtime = Object.freeze({
    appUrl: appUrl.href.replace(/\/$/, ""),
    appOrigin: appUrl.origin,
    allowedHosts,
    allowedExternalProtocols: defaults.allowedExternalProtocols,
    toolbarHeight: safePositive(defaults.toolbarHeight, 64, 48, 120),
    minimumWidth: safePositive(defaults.minimumWidth, 1120, 800, 3840),
    minimumHeight: safePositive(defaults.minimumHeight, 720, 600, 2160),
    defaultWidth: safePositive(persisted.window?.width || defaults.defaultWidth, 1540, 800, 7680),
    defaultHeight: safePositive(persisted.window?.height || defaults.defaultHeight, 980, 600, 4320),
    healthPath: String(defaults.healthPath || "/api/desktop/runtime/health"),
    healthCheckIntervalMs: safePositive(defaults.healthCheckIntervalMs, 30000, 10000, 600000),
    loadTimeoutMs: safePositive(defaults.loadTimeoutMs, 45000, 10000, 180000),
    desktopContractVersion: String(defaults.desktopContractVersion || "6.0.0"),
    releaseChannel: String(process.env.ANGELCARE_DESKTOP_RELEASE_CHANNEL || "stable").replace(/[^a-z0-9-]/gi, "").slice(0, 30) || "stable",
    buildId: String(process.env.ANGELCARE_DESKTOP_BUILD_ID || "local").replace(/[^a-zA-Z0-9._-]/g, "").slice(0, 100) || "local",
    isDevelopment,
    configPath,
    updateManifestUrl,
    updateAllowedHosts: [...new Set(updateAllowedHosts)],
    updateCheckIntervalMs: safePositive(defaults.updateCheckIntervalMs, 21600000, 3600000, 604800000),
    updateAutoCheck: defaults.updateAutoCheck !== false,
    updatePublicKeyPem: String(process.env.ANGELCARE_DESKTOP_UPDATE_PUBLIC_KEY_PEM || defaults.updatePublicKeyPem || ""),
    diagnosticMaxLogLines: safePositive(defaults.diagnosticMaxLogLines, 2500, 100, 20000),
    diagnosticRetentionDays: safePositive(defaults.diagnosticRetentionDays, 14, 1, 365),
    logMaxBytes: safePositive(defaults.logMaxBytes, 5242880, 524288, 104857600),
    logMaxArchives: safePositive(defaults.logMaxArchives, 5, 1, 20),
    whatsappMaxDownloadBytes: safePositive(defaults.whatsappMaxDownloadBytes, 262144000, 1048576, 2147483648),
    whatsappDownloadDirectory: String(defaults.whatsappDownloadDirectory || "ANGELCARE WhatsApp").replace(/[<>:\"/\\|?*]/g, "-").slice(0, 80),
    securityCspMode: process.env.ANGELCARE_DESKTOP_CSP_MODE === "enforce" ? "enforce" : String(defaults.securityCspMode || "report-only"),
    startupCrashLoopThreshold: safePositive(defaults.startupCrashLoopThreshold, 3, 2, 10),
    startupHealthyAfterMs: safePositive(defaults.startupHealthyAfterMs, 45000, 5000, 300000),
  });

  function persistWindowState(bounds, maximized) {
    atomicWriteJson(configPath, {
      schemaVersion: 2,
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
