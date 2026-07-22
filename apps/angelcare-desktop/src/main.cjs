"use strict";

const {
  app,
  BaseWindow,
  WebContentsView,
  Menu,
  ipcMain,
  protocol,
  net,
  session,
  shell,
  powerMonitor,
  crashReporter,
  dialog,
} = require("electron");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { loadRuntimeConfig } = require("./runtime/config.cjs");
const { createLogger } = require("./runtime/logger.cjs");
const { isAllowedAppNavigation, isSafeExternalUrl } = require("./runtime/url-policy.cjs");
const { createGovernanceController } = require("./runtime/governance.cjs");
const { createDiagnosticsController } = require("./runtime/diagnostics.cjs");
const { createStartupRecoveryController } = require("./runtime/startup-recovery.cjs");
const { createUpdateManager } = require("./runtime/update-manager.cjs");
const { createStationController } = require("./runtime/station-controller.cjs");
const { applySecurityHeaders, sanitizeFilename } = require("./runtime/security.cjs");

protocol.registerSchemesAsPrivileged([
  {
    scheme: "angelcare-desktop",
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: false,
    },
  },
]);

const APP_ID = "com.angelcare.desktop";
const APP_NAME = "ANGELCARE Desktop";
const SHELL_HOST = "shell";
const SHELL_URL = "angelcare-desktop://shell/index.html";
const WHATSAPP_PARTITION = "persist:angelcare-whatsapp-main";
const WHATSAPP_HOME = "https://web.whatsapp.com/";
const DESKTOP_ROUTE_PATHS = Object.freeze({
  home: "/",
  whatsapp: "/whatsapp-os",
  whatsappSession: "/whatsapp-os/web-session",
  whatsappAdmin: "/whatsapp-os/admin",
  whatsappControl: "/whatsapp-os/session-control",
});
const WHATSAPP_ALLOWED_NAVIGATION_HOSTS = new Set([
  "web.whatsapp.com",
  "www.whatsapp.com",
  "whatsapp.com",
]);
const WHATSAPP_RESOURCE_HOST_SUFFIXES = [
  ".whatsapp.com",
  ".whatsapp.net",
  ".fbcdn.net",
  ".facebook.com",
];
const DANGEROUS_DOWNLOAD_EXTENSIONS = new Set([
  ".app", ".bat", ".cmd", ".com", ".cpl", ".dll", ".dmg", ".exe", ".hta",
  ".jar", ".js", ".jse", ".lnk", ".msi", ".msp", ".pif", ".ps1", ".reg",
  ".scr", ".vbe", ".vbs", ".wsf", ".wsh",
]);
const WHATSAPP_PERMISSION_ALLOWLIST = new Set([
  "notifications",
  "media",
  "clipboard-read",
  "fullscreen",
  "fileSystem",
  "fileSystemAccess",
]);

let mainWindow = null;
let shellView = null;
let saasView = null;
let whatsappView = null;
let whatsappSession = null;
let saasSessionRuntime = null;
let governanceController = null;
let diagnosticsController = null;
let startupRecoveryController = null;
let updateManager = null;
let stationController = null;
let corporateBrowserState = null;
let stationState = null;
let activeDesktopSurface = "angelcare-system";
let closeAuthorizationPending = false;
let runtime = null;
let persistWindowState = null;
let logger = null;
let healthTimer = null;
let loadTimer = null;
let isQuitting = false;
let stationAuthorizedQuit = false;
let whatsappRequestedVisible = false;
let whatsappBounds = null;
let whatsappLayoutMode = "split";
let whatsappRestarting = false;
let whatsappDownloadSequence = 0;
let recentWhatsappDownloads = [];
let recentWhatsappPermissions = [];
let healthyTimer = null;

let currentState = {
  phase: "booting",
  message: "Initialisation du runtime ANGELCARE…",
  detail: null,
  online: null,
  loadedUrl: null,
  lastHealthyAt: null,
  lastErrorAt: null,
};

let whatsappState = {
  available: true,
  created: false,
  visible: false,
  requestedVisible: false,
  phase: "idle",
  message: "WhatsApp Web n’est pas encore ouvert.",
  detail: null,
  currentUrl: null,
  title: null,
  online: null,
  rendererStatus: "not-created",
  authProfile: "unknown",
  canGoBack: false,
  canGoForward: false,
  layoutMode: whatsappLayoutMode,
  partition: WHATSAPP_PARTITION,
  lastLoadStartedAt: null,
  lastLoadedAt: null,
  lastErrorAt: null,
  lastCrashAt: null,
  lastResponsiveAt: null,
  storagePath: null,
  downloads: [],
  permissions: [],
};

const hasSingleInstanceLock = app.requestSingleInstanceLock();
if (!hasSingleInstanceLock) app.quit();

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, Number(value) || 0));
}

function safeJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function mimeTypeFor(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  return {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
  }[extension] || "application/octet-stream";
}

async function registerLocalShellProtocol() {
  const localRoots = new Map([
    [SHELL_HOST, path.resolve(__dirname, "shell")],
    ["newtab", path.resolve(__dirname, "newtab")],
    ["unlock", path.resolve(__dirname, "unlock")],
  ]);
  await protocol.handle("angelcare-desktop", async (request) => {
    try {
      const url = new URL(request.url);
      const localRoot = localRoots.get(url.hostname);
      if (!localRoot) return new Response("Not found", { status: 404 });
      const requestedPath = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
      const filePath = path.resolve(localRoot, `.${requestedPath}`);
      if (!filePath.startsWith(`${localRoot}${path.sep}`) && filePath !== path.join(localRoot, "index.html")) {
        return new Response("Forbidden", { status: 403 });
      }
      const bytes = await fs.promises.readFile(filePath);
      return new Response(bytes, {
        status: 200,
        headers: {
          "Content-Type": mimeTypeFor(filePath),
          "Cache-Control": "no-store",
          "Content-Security-Policy": [
            "default-src 'none'",
            "script-src 'self'",
            "style-src 'self'",
            "img-src 'self' data:",
            "font-src 'none'",
            "connect-src 'none'",
            "object-src 'none'",
            "base-uri 'none'",
            "frame-ancestors 'none'",
          ].join("; "),
        },
      });
    } catch (error) {
      logger?.error("shell_protocol_failure", error);
      return new Response("Internal error", { status: 500 });
    }
  });
}

function desktopRuntimeInfo() {
  return Object.freeze({
    isDesktop: true,
    productName: APP_NAME,
    version: app.getVersion(),
    platform: process.platform,
    arch: process.arch,
    packaged: app.isPackaged,
    contractVersion: runtime.desktopContractVersion,
    releaseChannel: runtime.releaseChannel,
    buildId: runtime.buildId,
    targetOrigin: runtime.appOrigin,
    capabilities: Object.freeze({
      whatsappWebContentsView: true,
      whatsappPersistentSession: true,
      whatsappSessionControl: true,
      whatsappGovernance: true,
      whatsappDeviceRegistration: true,
      whatsappAuthorizationLeases: true,
      whatsappRemoteCommands: true,
      whatsappBusinessContext: true,
      whatsappOutcomeCapture: true,
      productionDiagnostics: true,
      controlledUpdates: true,
      crashLoopRecovery: true,
      signedInstallerReady: true,
      corporateStationOS: true,
      corporateMultiTabBrowser: true,
      corporateBrowserPartition: true,
      stationModes: true,
      nativeStationUnlock: true,
      stationRemoteCommands: true,
      perTabZoom: true,
      whatsappAutomation: false,
      whatsappDomAccess: false,
    }),
  });
}

function desktopNavigationState() {
  if (!saasView || saasView.webContents.isDestroyed()) {
    return {
      canGoBack: false,
      canGoForward: false,
      whatsappVisible: false,
      whatsappRequestedVisible,
    };
  }
  const history = saasView.webContents.navigationHistory;
  return {
    loadedUrl: saasView.webContents.getURL() || currentState.loadedUrl || null,
    canGoBack: history.canGoBack(),
    canGoForward: history.canGoForward(),
    whatsappVisible: Boolean(whatsappView?.getVisible()),
    whatsappRequestedVisible,
    activeDesktopSurface,
    corporateBrowser: corporateBrowserState,
    station: stationState,
  };
}

function sendShellState(patch = {}) {
  currentState = {
    ...currentState,
    ...desktopNavigationState(),
    ...patch,
    timestamp: new Date().toISOString(),
    appName: APP_NAME,
    appVersion: app.getVersion(),
    platform: process.platform,
    releaseChannel: runtime?.releaseChannel || "stable",
    buildId: runtime?.buildId || "local",
    targetUrl: runtime?.appUrl || null,
    activeDesktopSurface,
    corporateBrowser: corporateBrowserState,
    station: stationState,
  };
  if (shellView && !shellView.webContents.isDestroyed()) {
    shellView.webContents.send("angelcare-desktop:state", currentState);
  }
}

function publicWhatsappState() {
  return Object.freeze({
    ...safeJson(whatsappState),
    visible: Boolean(whatsappView?.getVisible()),
    requestedVisible: whatsappRequestedVisible,
    layoutMode: whatsappLayoutMode,
    downloads: safeJson(recentWhatsappDownloads),
    permissions: safeJson(recentWhatsappPermissions),
    timestamp: new Date().toISOString(),
  });
}

function sendWhatsappState(patch = {}) {
  whatsappState = {
    ...whatsappState,
    ...patch,
    downloads: safeJson(recentWhatsappDownloads),
    permissions: safeJson(recentWhatsappPermissions),
  };
  const state = publicWhatsappState();
  if (saasView && !saasView.webContents.isDestroyed()) {
    saasView.webContents.send("angelcare-desktop:whatsapp-state", state);
  }
  sendShellState();
  return state;
}


function sendCorporateBrowserState(state) {
  corporateBrowserState = safeJson(state || {});
  if (shellView && !shellView.webContents.isDestroyed()) shellView.webContents.send("angelcare-desktop:corporate-state", corporateBrowserState);
  if (saasView && !saasView.webContents.isDestroyed()) saasView.webContents.send("angelcare-desktop:corporate-state", corporateBrowserState);
  sendShellState();
}

function sendStationState(state) {
  stationState = safeJson(state || {});
  if (shellView && !shellView.webContents.isDestroyed()) shellView.webContents.send("angelcare-desktop:station-state", stationState);
  if (saasView && !saasView.webContents.isDestroyed()) saasView.webContents.send("angelcare-desktop:station-state", stationState);
  sendShellState();
}

function sendGovernanceState(state) {
  if (saasView && !saasView.webContents.isDestroyed()) {
    saasView.webContents.send("angelcare-desktop:governance-state", safeJson(state));
  }
}

function sendReleaseState(state) {
  if (saasView && !saasView.webContents.isDestroyed()) {
    saasView.webContents.send("angelcare-desktop:release-state", safeJson(state));
  }
}

function publicProductionStatus() {
  return Object.freeze({
    runtime: desktopRuntimeInfo(),
    release: updateManager?.getState() || null,
    diagnostics: diagnosticsController?.getStatus() || null,
    startupRecovery: startupRecoveryController?.getState() || null,
    station: stationController?.getStatus() || null,
    corporateBrowser: stationController?.corporateBrowser?.getState() || null,
    timestamp: new Date().toISOString(),
  });
}

function requireGovernedWhatsappAccess(action) {
  if (!governanceController) throw new Error("WhatsApp governance is not initialized.");
  if (!governanceController.canOpen()) {
    governanceController.enforceAccess(`blocked-${action}`);
    throw new Error("WHATSAPP_DESKTOP_ACCESS_NOT_AUTHORIZED");
  }
}

function isWhatsappNavigationAllowed(rawUrl) {
  try {
    const url = new URL(rawUrl);
    if (url.protocol === "about:" && url.href === "about:blank") return true;
    if (url.protocol !== "https:") return false;
    const host = url.hostname.toLowerCase();
    return WHATSAPP_ALLOWED_NAVIGATION_HOSTS.has(host) || host.endsWith(".whatsapp.com");
  } catch {
    return false;
  }
}

function isWhatsappResourceOrigin(rawUrl) {
  try {
    const url = new URL(rawUrl);
    if (url.protocol !== "https:") return false;
    const host = url.hostname.toLowerCase();
    return host === "web.whatsapp.com" || WHATSAPP_RESOURCE_HOST_SUFFIXES.some((suffix) => host.endsWith(suffix));
  } catch {
    return false;
  }
}

function normalizeWhatsappPhone(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits || digits.length < 7 || digits.length > 15) return null;
  return digits;
}

function buildWhatsappNavigationUrl(payload = {}) {
  const phone = normalizeWhatsappPhone(payload.phone);
  const text = String(payload.text || "").slice(0, 8000);
  if (!phone) return WHATSAPP_HOME;
  const url = new URL("https://web.whatsapp.com/send");
  url.searchParams.set("phone", phone);
  if (text) url.searchParams.set("text", text);
  return url.href;
}

function desktopRouteUrl(routePath) {
  const route = String(routePath || "/");
  if (!Object.values(DESKTOP_ROUTE_PATHS).includes(route)) throw new Error("Unsupported ANGELCARE desktop route.");
  return new URL(route, `${runtime.appOrigin}/`).href;
}

async function navigateDesktopRoute(routePath, source = "desktop-toolbar") {
  if (!saasView || saasView.webContents.isDestroyed()) throw new Error("ANGELCARE SaaS view is unavailable.");
  const target = desktopRouteUrl(routePath);
  if (routePath !== DESKTOP_ROUTE_PATHS.whatsappSession) hideWhatsappView(`route:${source}`);
  setSaasVisible(true);
  if (saasView.webContents.getURL() !== target) await saasView.webContents.loadURL(target);
  else sendShellState({ loadedUrl: target });
  logger.info("desktop_route_navigation", { source, routePath, target });
  return { ok: true, target };
}

async function openWhatsappWorkspace(source = "desktop-toolbar") {
  requireGovernedWhatsappAccess("show");
  whatsappRequestedVisible = true;
  const whatsappReady = ensureWhatsappView({ load: true });
  const target = desktopRouteUrl(DESKTOP_ROUTE_PATHS.whatsappSession);
  setSaasVisible(true);
  if (!saasView || saasView.webContents.isDestroyed()) throw new Error("ANGELCARE SaaS view is unavailable.");
  if (saasView.webContents.getURL() !== target) await saasView.webContents.loadURL(target);
  await whatsappReady;
  logger.info("whatsapp_workspace_open_requested", { source, target });
  return showWhatsappView();
}

function layoutViews() {
  if (!mainWindow || !shellView || !saasView) return;
  const contentBounds = mainWindow.getContentBounds();
  const width = Math.max(0, Math.floor(contentBounds.width));
  const height = Math.max(0, Math.floor(contentBounds.height));
  const toolbarHeight = Math.min(runtime.toolbarHeight, height);

  shellView.setBounds({ x: 0, y: 0, width, height });
  if (saasView.getVisible()) {
    saasView.setBounds({ x: 0, y: toolbarHeight, width, height: Math.max(0, height - toolbarHeight) });
  }

  stationController?.resize();
  if (!whatsappView || !whatsappView.getVisible() || !whatsappBounds || !saasView.getVisible()) return;
  const maxWorkspaceHeight = Math.max(0, height - toolbarHeight);
  const x = clamp(Math.floor(whatsappBounds.x), 0, width);
  const yWithinSaas = clamp(Math.floor(whatsappBounds.y), 0, maxWorkspaceHeight);
  const requestedWidth = Math.max(0, Math.floor(whatsappBounds.width));
  const requestedHeight = Math.max(0, Math.floor(whatsappBounds.height));
  const boundedWidth = clamp(requestedWidth, 0, Math.max(0, width - x));
  const boundedHeight = clamp(requestedHeight, 0, Math.max(0, maxWorkspaceHeight - yWithinSaas));

  whatsappView.setBounds({
    x,
    y: toolbarHeight + yWithinSaas,
    width: boundedWidth,
    height: boundedHeight,
  });
}

function setSaasVisible(visible) {
  if (!saasView) return;
  saasView.setVisible(Boolean(visible));
  if (!visible && whatsappView) whatsappView.setVisible(false);
  if (visible && whatsappView && whatsappRequestedVisible && whatsappBounds) whatsappView.setVisible(true);
  layoutViews();
}

function validateShellSender(event) {
  return Boolean(shellView && event.sender.id === shellView.webContents.id);
}

function validateSaasSender(event) {
  return Boolean(saasView && event.sender.id === saasView.webContents.id);
}

function normalizeWhatsappBounds(input) {
  const x = Number(input?.x);
  const y = Number(input?.y);
  const width = Number(input?.width);
  const height = Number(input?.height);
  if (![x, y, width, height].every(Number.isFinite)) throw new Error("Invalid WhatsApp view bounds.");
  return {
    x: Math.max(0, Math.floor(x)),
    y: Math.max(0, Math.floor(y)),
    width: Math.max(0, Math.floor(width)),
    height: Math.max(0, Math.floor(height)),
  };
}

async function inspectWhatsappAuthProfile() {
  if (!whatsappSession) return "unknown";
  try {
    const [cookies, storageData] = await Promise.all([
      whatsappSession.cookies.get({ domain: ".whatsapp.com" }),
      whatsappSession.getCacheSize().catch(() => 0),
    ]);
    if (cookies.length > 0 || storageData > 1024 * 1024) return "local-profile-present";
    return "qr-likely-required";
  } catch (error) {
    logger.warn("whatsapp_auth_profile_inspection_failed", { message: error instanceof Error ? error.message : String(error) });
    return "unknown";
  }
}

function recordWhatsappPermission(permission, allowed, details = {}) {
  recentWhatsappPermissions = [
    {
      permission,
      allowed: Boolean(allowed),
      origin: details.origin || null,
      mediaTypes: Array.isArray(details.mediaTypes) ? details.mediaTypes : [],
      at: new Date().toISOString(),
    },
    ...recentWhatsappPermissions,
  ].slice(0, 25);
  sendWhatsappState();
}

function configureWhatsappSession() {
  if (whatsappSession) return whatsappSession;
  whatsappSession = session.fromPartition(WHATSAPP_PARTITION, { cache: true });

  whatsappSession.setPermissionRequestHandler((webContents, permission, callback, details) => {
    const requestingUrl = details?.requestingUrl || webContents.getURL();
    const policy = governanceController?.getState()?.policy || {};
    const mediaTypes = Array.isArray(details?.mediaTypes) ? details.mediaTypes : [];
    let policyAllowed = true;
    if (permission === "notifications") policyAllowed = policy.allow_notifications !== false;
    if (permission === "media") {
      if (mediaTypes.includes("audio")) policyAllowed = policyAllowed && policy.allow_microphone !== false;
      if (mediaTypes.includes("video")) policyAllowed = policyAllowed && policy.allow_camera !== false;
    }
    if (permission === "fileSystem" || permission === "fileSystemAccess") policyAllowed = policy.allow_uploads !== false;
    const allowed = isWhatsappResourceOrigin(requestingUrl) && WHATSAPP_PERMISSION_ALLOWLIST.has(permission) && policyAllowed && Boolean(governanceController?.canOpen());
    recordWhatsappPermission(permission, allowed, {
      origin: (() => { try { return new URL(requestingUrl).origin; } catch { return null; } })(),
      mediaTypes: details?.mediaTypes,
    });
    logger.info("whatsapp_permission_request", { permission, allowed, requestingUrl, mediaTypes: details?.mediaTypes || [] });
    callback(allowed);
  });

  whatsappSession.setPermissionCheckHandler((webContents, permission, requestingOrigin) => {
    const origin = requestingOrigin || webContents?.getURL?.() || "";
    const policy = governanceController?.getState()?.policy || {};
    if (permission === "notifications" && policy.allow_notifications === false) return false;
    if ((permission === "fileSystem" || permission === "fileSystemAccess") && policy.allow_uploads === false) return false;
    return Boolean(governanceController?.canOpen()) && isWhatsappResourceOrigin(origin) && WHATSAPP_PERMISSION_ALLOWLIST.has(permission);
  });

  whatsappSession.setDevicePermissionHandler(() => false);
  whatsappSession.setDisplayMediaRequestHandler((_request, callback) => callback({}));

  whatsappSession.on("will-download", (event, item, webContents) => {
    const sourceUrl = item.getURL();
    if (governanceController?.getState()?.policy?.allow_downloads === false || !governanceController?.canOpen()) {
      event.preventDefault();
      logger.warn("whatsapp_download_blocked_policy", { sourceUrl });
      sendWhatsappState({ message: "Téléchargement bloqué par la politique de l’espace WhatsApp." });
      return;
    }
    if (!whatsappView || webContents.id !== whatsappView.webContents.id || !isWhatsappResourceOrigin(sourceUrl)) {
      event.preventDefault();
      logger.warn("whatsapp_download_blocked_untrusted_source", { sourceUrl });
      return;
    }

    const filename = sanitizeFilename(item.getFilename() || "whatsapp-download", "whatsapp-download");
    const extension = path.extname(filename).toLowerCase();
    const id = `WADL-${Date.now()}-${++whatsappDownloadSequence}`;
    const downloadDirectory = path.join(app.getPath("downloads"), runtime.whatsappDownloadDirectory);
    fs.mkdirSync(downloadDirectory, { recursive: true });

    if (item.getTotalBytes() > runtime.whatsappMaxDownloadBytes) {
      event.preventDefault();
      recentWhatsappDownloads = [{ id, filename, state: "blocked", receivedBytes: 0, totalBytes: item.getTotalBytes(), savePath: null, reason: "file-too-large", at: new Date().toISOString() }, ...recentWhatsappDownloads].slice(0, 30);
      sendWhatsappState({ message: `Téléchargement bloqué : ${filename} dépasse la limite autorisée.` });
      logger.warn("whatsapp_download_blocked_size", { filename, totalBytes: item.getTotalBytes(), maximumBytes: runtime.whatsappMaxDownloadBytes });
      return;
    }

    if (DANGEROUS_DOWNLOAD_EXTENSIONS.has(extension)) {
      event.preventDefault();
      const record = {
        id,
        filename,
        state: "blocked",
        receivedBytes: 0,
        totalBytes: item.getTotalBytes(),
        savePath: null,
        reason: "dangerous-file-type",
        at: new Date().toISOString(),
      };
      recentWhatsappDownloads = [record, ...recentWhatsappDownloads].slice(0, 30);
      sendWhatsappState({ message: `Téléchargement bloqué : ${filename}` });
      logger.warn("whatsapp_download_blocked_extension", { filename, extension, sourceUrl });
      return;
    }

    const uniqueSuffix = crypto.randomBytes(3).toString("hex");
    const parsed = path.parse(filename);
    const savePath = path.join(downloadDirectory, `${parsed.name}-${uniqueSuffix}${parsed.ext}`);
    item.setSavePath(savePath);

    const record = {
      id,
      filename,
      state: "progressing",
      receivedBytes: 0,
      totalBytes: item.getTotalBytes(),
      savePath,
      reason: null,
      at: new Date().toISOString(),
    };
    recentWhatsappDownloads = [record, ...recentWhatsappDownloads].slice(0, 30);
    sendWhatsappState();
    logger.info("whatsapp_download_started", { id, filename, savePath, sourceUrl });

    item.on("updated", (_event, state) => {
      recentWhatsappDownloads = recentWhatsappDownloads.map((entry) => entry.id === id ? {
        ...entry,
        state: state === "interrupted" ? "interrupted" : "progressing",
        receivedBytes: item.getReceivedBytes(),
        totalBytes: item.getTotalBytes(),
      } : entry);
      sendWhatsappState();
    });

    item.once("done", (_event, state) => {
      recentWhatsappDownloads = recentWhatsappDownloads.map((entry) => entry.id === id ? {
        ...entry,
        state,
        receivedBytes: item.getReceivedBytes(),
        totalBytes: item.getTotalBytes(),
        completedAt: new Date().toISOString(),
      } : entry);
      sendWhatsappState({ message: state === "completed" ? `Téléchargement terminé : ${filename}` : `Téléchargement ${state} : ${filename}` });
      logger.info("whatsapp_download_finished", { id, filename, state, savePath });
    });
  });

  return whatsappSession;
}

function updateWhatsappNavigationState(patch = {}) {
  if (!whatsappView || whatsappView.webContents.isDestroyed()) return sendWhatsappState(patch);
  return sendWhatsappState({
    currentUrl: whatsappView.webContents.getURL() || null,
    title: whatsappView.webContents.getTitle() || null,
    canGoBack: whatsappView.webContents.navigationHistory.canGoBack(),
    canGoForward: whatsappView.webContents.navigationHistory.canGoForward(),
    ...patch,
  });
}

function configureWhatsappViewEvents(view) {
  const wc = view.webContents;
  const chromeVersion = process.versions.chrome;
  const platformToken = process.platform === "darwin"
    ? "Macintosh; Intel Mac OS X 10_15_7"
    : process.platform === "win32"
      ? "Windows NT 10.0; Win64; x64"
      : "X11; Linux x86_64";

  wc.setUserAgent(
    `Mozilla/5.0 (${platformToken}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Safari/537.36`,
  );

  wc.setWindowOpenHandler(({ url }) => {
    if (governanceController?.getState()?.policy?.allow_external_open !== false && isSafeExternalUrl(url, runtime)) void shell.openExternal(url);
    logger.info("whatsapp_window_open_external", { url });
    return { action: "deny" };
  });

  wc.on("will-navigate", (event, url) => {
    if (isWhatsappNavigationAllowed(url)) return;
    event.preventDefault();
    if (isSafeExternalUrl(url, runtime)) void shell.openExternal(url);
    logger.warn("whatsapp_navigation_blocked", { url });
    updateWhatsappNavigationState({ message: "Navigation externe bloquée et ouverte séparément." });
  });

  wc.on("did-start-loading", () => {
    updateWhatsappNavigationState({
      phase: "loading",
      message: "Chargement de WhatsApp Web…",
      detail: null,
      online: null,
      rendererStatus: "loading",
      lastLoadStartedAt: new Date().toISOString(),
    });
  });

  wc.on("did-finish-load", async () => {
    const authProfile = await inspectWhatsappAuthProfile();
    updateWhatsappNavigationState({
      phase: authProfile === "qr-likely-required" ? "qr-likely-required" : "ready",
      message: authProfile === "qr-likely-required"
        ? "WhatsApp Web est chargé. Un QR peut être requis pour cette station."
        : "WhatsApp Web est chargé dans le profil local sécurisé.",
      detail: authProfile === "local-profile-present" ? "Profil local persistant détecté." : null,
      online: true,
      rendererStatus: "responsive",
      authProfile,
      lastLoadedAt: new Date().toISOString(),
      lastResponsiveAt: new Date().toISOString(),
      storagePath: whatsappSession?.storagePath || null,
    });
    logger.info("whatsapp_loaded", { url: wc.getURL(), authProfile });
  });

  wc.on("page-title-updated", (_event, title) => updateWhatsappNavigationState({ title }));
  wc.on("did-navigate", (_event, url) => updateWhatsappNavigationState({ currentUrl: url }));
  wc.on("did-navigate-in-page", (_event, url) => updateWhatsappNavigationState({ currentUrl: url }));

  wc.on("did-fail-load", (_event, errorCode, errorDescription, validatedUrl, isMainFrame) => {
    if (!isMainFrame || errorCode === -3) return;
    updateWhatsappNavigationState({
      phase: "error",
      message: "WhatsApp Web n’a pas pu être chargé.",
      detail: `${errorDescription} (${errorCode})`,
      online: false,
      rendererStatus: "load-failed",
      currentUrl: validatedUrl || WHATSAPP_HOME,
      lastErrorAt: new Date().toISOString(),
    });
    logger.warn("whatsapp_load_failed", { errorCode, errorDescription, validatedUrl });
  });

  wc.on("unresponsive", () => {
    updateWhatsappNavigationState({
      phase: "unresponsive",
      message: "Le moteur WhatsApp Web ne répond plus.",
      detail: "Utilisez Redémarrer le moteur WhatsApp.",
      rendererStatus: "unresponsive",
      lastErrorAt: new Date().toISOString(),
    });
    logger.warn("whatsapp_unresponsive");
  });

  wc.on("responsive", () => {
    updateWhatsappNavigationState({
      phase: "ready",
      message: "WhatsApp Web répond de nouveau.",
      detail: null,
      rendererStatus: "responsive",
      online: true,
      lastResponsiveAt: new Date().toISOString(),
    });
    logger.info("whatsapp_responsive");
  });

  wc.on("render-process-gone", (_event, details) => {
    updateWhatsappNavigationState({
      phase: "crashed",
      message: "Le moteur WhatsApp Web s’est arrêté.",
      detail: `${details.reason}${details.exitCode !== undefined ? ` · code ${details.exitCode}` : ""}`,
      rendererStatus: "crashed",
      online: null,
      lastCrashAt: new Date().toISOString(),
      lastErrorAt: new Date().toISOString(),
    });
    logger.warn("whatsapp_renderer_gone", details);
  });
}

async function ensureWhatsappView({ load = true } = {}) {
  if (whatsappView && !whatsappView.webContents.isDestroyed()) return whatsappView;
  const ses = configureWhatsappSession();
  whatsappView = new WebContentsView({
    webPreferences: {
      session: ses,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      devTools: runtime.isDevelopment,
      spellcheck: true,
      safeDialogs: true,
      safeDialogsMessage: "ANGELCARE a bloqué des dialogues répétés provenant de WhatsApp Web.",
    },
  });
  whatsappView.setBackgroundColor("#f0f2f5");
  whatsappView.setVisible(false);
  mainWindow.contentView.addChildView(whatsappView);
  configureWhatsappViewEvents(whatsappView);
  sendWhatsappState({
    created: true,
    phase: "created",
    message: "Moteur WhatsApp Web initialisé.",
    rendererStatus: "created",
    storagePath: ses.storagePath || null,
  });
  logger.info("whatsapp_view_created", { partition: WHATSAPP_PARTITION, storagePath: ses.storagePath });
  if (load) await whatsappView.webContents.loadURL(WHATSAPP_HOME);
  return whatsappView;
}

function showWhatsappView() {
  if (governanceController && !governanceController.canOpen()) {
    whatsappRequestedVisible = false;
    if (whatsappView) whatsappView.setVisible(false);
    governanceController.enforceAccess("show-request");
    return sendWhatsappState({ visible: false, requestedVisible: false, phase: "access-blocked", message: "Accès WhatsApp Desktop non autorisé." });
  }
  whatsappRequestedVisible = true;
  if (!whatsappView || !whatsappBounds || !saasView?.getVisible()) return sendWhatsappState({ requestedVisible: true });
  whatsappView.setVisible(true);
  layoutViews();
  return sendWhatsappState({ visible: true, requestedVisible: true });
}

function hideWhatsappView(reason = "user") {
  const wasRequestedVisible = whatsappRequestedVisible;
  const wasVisible = Boolean(whatsappView?.getVisible?.());

  whatsappRequestedVisible = false;

  if (whatsappView) whatsappView.setVisible(false);

  // WHATSAPP_HIDE_DEDUPLICATION_V1
  if (wasRequestedVisible || wasVisible) {
    logger.info("whatsapp_view_hidden", { reason });
  }

  return sendWhatsappState({
    visible: false,
    requestedVisible: false,
  });
}

async function restartWhatsappView() {
  if (whatsappRestarting) return publicWhatsappState();
  whatsappRestarting = true;
  const shouldShow = whatsappRequestedVisible;
  const previousBounds = whatsappBounds;
  try {
    sendWhatsappState({ phase: "restarting", message: "Redémarrage contrôlé du moteur WhatsApp…", rendererStatus: "restarting" });
    if (whatsappView && !whatsappView.webContents.isDestroyed()) {
      whatsappView.setVisible(false);
      mainWindow.contentView.removeChildView(whatsappView);
      whatsappView.webContents.close();
    }
    whatsappView = null;
    whatsappBounds = previousBounds;
    await ensureWhatsappView({ load: true });
    whatsappRequestedVisible = shouldShow;
    if (shouldShow) showWhatsappView();
    logger.info("whatsapp_view_restarted");
    return publicWhatsappState();
  } finally {
    whatsappRestarting = false;
  }
}

async function clearWhatsappCache() {
  const ses = configureWhatsappSession();
  await ses.clearCache();
  logger.info("whatsapp_cache_cleared");
  return sendWhatsappState({ message: "Cache WhatsApp Web effacé. La session liée est conservée." });
}

async function clearWhatsappSession(options = {}) {
  const remote = options.remote === true;
  const confirmation = remote ? { response: 1 } : await dialog.showMessageBox({
    type: "warning",
    buttons: ["Annuler", "Effacer la session locale"],
    defaultId: 0,
    cancelId: 0,
    title: "Effacer la session WhatsApp locale",
    message: "Cette action déconnecte WhatsApp Web de cette station.",
    detail: "Cookies, IndexedDB, cache, service workers et stockage local du profil WhatsApp seront supprimés. Un nouveau QR sera requis.",
    noLink: true,
  });
  if (confirmation.response !== 1) return { cancelled: true, state: publicWhatsappState() };
  hideWhatsappView("clear-session");
  const ses = configureWhatsappSession();
  await ses.clearStorageData({
    storages: ["cookies", "localstorage", "indexdb", "serviceworkers", "cachestorage", "websql", "shadercache"],
    quotas: ["temporary", "persistent", "syncable"],
  });
  await ses.clearCache();
  await ses.cookies.flushStore();
  recentWhatsappDownloads = [];
  recentWhatsappPermissions = [];
  sendWhatsappState({
    authProfile: "qr-likely-required",
    phase: "session-cleared",
    message: "Session WhatsApp locale effacée. Un nouveau QR sera requis.",
    detail: null,
    currentUrl: null,
  });
  logger.warn("whatsapp_session_cleared");
  await restartWhatsappView();
  return { cancelled: false, state: publicWhatsappState() };
}

async function openWhatsappDownloadsFolder() {
  const folder = path.join(app.getPath("downloads"), runtime.whatsappDownloadDirectory);
  fs.mkdirSync(folder, { recursive: true });
  await shell.openPath(folder);
  return { ok: true, folder };
}

async function handleWhatsappCommand(action, payload = {}) {
  if (["show", "navigate", "focus", "set-layout", "open-downloads", "open-external"].includes(action)) {
    if (action !== "set-layout" || String(payload.layout || "") !== "hidden") requireGovernedWhatsappAccess(action);
  }
  if (action === "clear-cache" && governanceController?.getState()?.policy?.allow_local_cache_clear === false) throw new Error("CLEAR_CACHE_DISABLED_BY_POLICY");
  if (action === "clear-session" && governanceController?.getState()?.policy?.allow_local_session_clear === false) throw new Error("CLEAR_SESSION_DISABLED_BY_POLICY");
  if (action === "open-external" && governanceController?.getState()?.policy?.allow_external_open === false) throw new Error("EXTERNAL_OPEN_DISABLED_BY_POLICY");
  switch (action) {
    case "get-status":
      return publicWhatsappState();
    case "show":
      await ensureWhatsappView({ load: true });
      return showWhatsappView();
    case "hide":
      return hideWhatsappView("saas-command");
    case "reload":
      await ensureWhatsappView({ load: true });
      whatsappView.webContents.reload();
      return publicWhatsappState();
    case "hard-reload":
      await ensureWhatsappView({ load: true });
      await whatsappView.webContents.session.clearCache();
      whatsappView.webContents.reloadIgnoringCache();
      return publicWhatsappState();
    case "go-back":
      if (whatsappView?.webContents.navigationHistory.canGoBack()) whatsappView.webContents.navigationHistory.goBack();
      return publicWhatsappState();
    case "go-forward":
      if (whatsappView?.webContents.navigationHistory.canGoForward()) whatsappView.webContents.navigationHistory.goForward();
      return publicWhatsappState();
    case "focus":
      await ensureWhatsappView({ load: true });
      showWhatsappView();
      whatsappView.webContents.focus();
      return publicWhatsappState();
    case "open-external":
      await shell.openExternal(whatsappView?.webContents.getURL() || WHATSAPP_HOME);
      return publicWhatsappState();
    case "navigate": {
      await ensureWhatsappView({ load: false });
      logger.info("whatsapp_business_context_navigation", { contextId: String(payload.contextId || "").slice(0, 100) || null, attemptId: String(payload.attemptId || "").slice(0, 100) || null, hasPreparedText: Boolean(payload.text), phoneDigits: normalizeWhatsappPhone(payload.phone)?.length || 0 });
      const url = buildWhatsappNavigationUrl(payload);
      await whatsappView.webContents.loadURL(url);
      showWhatsappView();
      return publicWhatsappState();
    }
    case "restart":
      return restartWhatsappView();
    case "clear-cache":
      return clearWhatsappCache();
    case "clear-session":
      return clearWhatsappSession();
    case "open-downloads":
      return openWhatsappDownloadsFolder();
    case "set-layout": {
      const layout = String(payload.layout || "split");
      if (!["split", "focus", "full", "hidden"].includes(layout)) throw new Error("Unsupported WhatsApp layout mode.");
      whatsappLayoutMode = layout;
      if (layout === "hidden") hideWhatsappView("layout-hidden");
      else showWhatsappView();
      return sendWhatsappState({ layoutMode: whatsappLayoutMode });
    }
    default:
      throw new Error(`Unsupported WhatsApp desktop action: ${String(action)}`);
  }
}


async function handleCorporateCommand(action, payload = {}) {
  if (!stationController) throw new Error("Corporate Station runtime is not initialized.");
  const browser = stationController.corporateBrowser;
  switch (String(action || "")) {
    case "list":
    case "get-status": return browser.getState();
    case "create": return browser.createTab(payload || {});
    case "close": return browser.closeTab(String(payload.id || payload.tabId || ""));
    case "close-others": return browser.closeOtherTabs(String(payload.id || payload.tabId || ""));
    case "activate": return browser.activateTab(String(payload.id || payload.tabId || ""));
    case "duplicate": return browser.duplicateTab(String(payload.id || payload.tabId || ""));
    case "pin": return browser.pinTab(String(payload.id || payload.tabId || ""), payload.pinned !== false);
    case "reorder": return browser.reorderTab(String(payload.id || payload.tabId || ""), payload.targetIndex);
    case "reopen-closed": return browser.reopenClosed();
    case "navigate": return browser.navigate(String(payload.id || payload.tabId || ""), payload.url || payload.input || "");
    case "back": return browser.back(payload.id || payload.tabId);
    case "forward": return browser.forward(payload.id || payload.tabId);
    case "reload": return browser.reload(payload.id || payload.tabId);
    case "reload-no-cache": return browser.reloadIgnoringCache(payload.id || payload.tabId);
    case "stop": return browser.stop(payload.id || payload.tabId);
    case "home": return browser.home(payload.id || payload.tabId);
    case "zoom-in": return browser.zoomIn(payload.id || payload.tabId);
    case "zoom-out": return browser.zoomOut(payload.id || payload.tabId);
    case "zoom-reset": return browser.zoomReset(payload.id || payload.tabId);
    case "set-zoom": return browser.setZoom(payload.id || payload.tabId, payload.zoom);
    case "fit-workspace": return browser.fitWorkspace(payload.id || payload.tabId);
    case "recover": return browser.recoverTab(String(payload.id || payload.tabId || ""));
    case "clear-cache": return browser.clearCache();
    case "clear-data": return browser.clearData();
    case "open-downloads": return browser.openDownloads();
    default: throw new Error(`Unsupported corporate browser action: ${String(action)}`);
  }
}

async function handleStationCommand(action, payload = {}) {
  if (!stationController) throw new Error("Corporate Station runtime is not initialized.");
  switch (String(action || "")) {
    case "get-status": return stationController.getStatus();
    case "get-policy": return stationController.getPolicy();
    case "refresh-policy": return stationController.refreshPolicy({ source: "renderer" });
    case "request-mode": return stationController.requestMode(String(payload.mode || ""), "renderer");
    case "request-unlock": return stationController.requestUnlock("renderer");
    case "get-lockout-status": return stationController.unlockController.getStatus();
    case "get-diagnostics": return publicProductionStatus();
    default: throw new Error(`Unsupported station action: ${String(action)}`);
  }
}

function installIpcHandlers() {
  ipcMain.handle("angelcare-desktop:shell-action", async (event, action) => {
    if (!validateShellSender(event)) throw new Error("Unauthorized desktop IPC sender.");
    switch (action) {
      case "retry": await loadSaas({ hard: false, reason: "shell_retry" }); return { ok: true };
      case "reload": saasView?.webContents.reload(); return { ok: true };
      case "hard-reload": saasView?.webContents.reloadIgnoringCache(); return { ok: true };
      case "go-back": if (saasView?.webContents.navigationHistory.canGoBack()) saasView.webContents.navigationHistory.goBack(); return { ok: true };
      case "go-forward": if (saasView?.webContents.navigationHistory.canGoForward()) saasView.webContents.navigationHistory.goForward(); return { ok: true };
      case "go-home": return navigateDesktopRoute(DESKTOP_ROUTE_PATHS.home, "desktop-toolbar");
      case "go-whatsapp-os": return navigateDesktopRoute(DESKTOP_ROUTE_PATHS.whatsapp, "desktop-toolbar");
      case "go-whatsapp-session": return navigateDesktopRoute(DESKTOP_ROUTE_PATHS.whatsappSession, "desktop-toolbar");
      case "go-whatsapp-admin": return navigateDesktopRoute(DESKTOP_ROUTE_PATHS.whatsappAdmin, "desktop-toolbar");
      case "go-whatsapp-control": return navigateDesktopRoute(DESKTOP_ROUTE_PATHS.whatsappControl, "desktop-toolbar");
      case "open-whatsapp-workspace": return openWhatsappWorkspace("desktop-toolbar");
      case "hide-whatsapp-workspace": return hideWhatsappView("desktop-toolbar");
      case "open-browser": return stationController?.corporateBrowser.createTab({ url: runtime.appUrl, title: "ANGELCARE Web", activate: true });
      case "show-app": setSaasVisible(true); return { ok: true };
      case "hide-app": setSaasVisible(false); return { ok: true };
      case "quit": app.quit(); return { ok: true };
      default: throw new Error(`Unsupported desktop action: ${String(action)}`);
    }
  });

  ipcMain.handle("angelcare-desktop:get-runtime", (event) => {
    if (!validateShellSender(event)) throw new Error("Unauthorized desktop IPC sender.");
    return desktopRuntimeInfo();
  });

  ipcMain.handle("angelcare-desktop:whatsapp-command", async (event, action, payload) => {
    if (!validateSaasSender(event)) throw new Error("Unauthorized WhatsApp IPC sender.");
    logger.info("whatsapp_command", { action });
    return handleWhatsappCommand(String(action || ""), payload || {});
  });

  ipcMain.handle("angelcare-desktop:whatsapp-bounds", async (event, input) => {
    if (!validateSaasSender(event)) throw new Error("Unauthorized WhatsApp bounds sender.");
    whatsappBounds = normalizeWhatsappBounds(input);
    if (whatsappRequestedVisible && whatsappView && governanceController?.canOpen()) whatsappView.setVisible(true);
    layoutViews();
    return publicWhatsappState();
  });

  ipcMain.handle("angelcare-desktop:governance-command", async (event, action, payload) => {
    if (!validateSaasSender(event)) throw new Error("Unauthorized governance IPC sender.");
    if (!governanceController) throw new Error("WhatsApp governance is not initialized.");
    switch (String(action || "")) {
      case "get-status": return governanceController.getState();
      case "register": return governanceController.register();
      case "heartbeat": return governanceController.heartbeat();
      case "refresh": return governanceController.refresh();
      case "select-workspace": return governanceController.selectWorkspace(payload || {});
      default: throw new Error(`Unsupported governance action: ${String(action)}`);
    }
  });


  ipcMain.handle("angelcare-desktop:corporate-command", async (event, action, payload) => {
    if (!validateSaasSender(event) && !validateShellSender(event)) throw new Error("Unauthorized corporate-browser IPC sender.");
    logger.info("corporate_browser_command", { action: String(action || "") });
    return handleCorporateCommand(action, payload || {});
  });

  ipcMain.handle("angelcare-desktop:station-command", async (event, action, payload) => {
    if (!validateSaasSender(event) && !validateShellSender(event)) throw new Error("Unauthorized station IPC sender.");
    logger.info("station_command", { action: String(action || "") });
    return handleStationCommand(action, payload || {});
  });


  ipcMain.handle("angelcare-desktop:release-command", async (event, action) => {
    if (!validateSaasSender(event)) throw new Error("Unauthorized release IPC sender.");
    if (!updateManager) throw new Error("Release manager is not initialized.");
    switch (String(action || "")) {
      case "get-status": return updateManager.getState();
      case "check": return updateManager.check();
      case "download": return updateManager.download();
      case "restart-to-update": return updateManager.restartToUpdate();
      case "reveal-download": return updateManager.revealDownload();
      default: throw new Error(`Unsupported release action: ${String(action)}`);
    }
  });

  ipcMain.handle("angelcare-desktop:diagnostics-command", async (event, action) => {
    if (!validateSaasSender(event)) throw new Error("Unauthorized diagnostics IPC sender.");
    if (!diagnosticsController) throw new Error("Diagnostics controller is not initialized.");
    switch (String(action || "")) {
      case "get-status": return diagnosticsController.getStatus();
      case "export": return diagnosticsController.exportBundle();
      case "get-production-status": return publicProductionStatus();
      default: throw new Error(`Unsupported diagnostics action: ${String(action)}`);
    }
  });
}

function configureSaasSession() {
  const saasSession = session.fromPartition("persist:angelcare-saas", { cache: true });
  saasSessionRuntime = saasSession;
  const requestFilter = { urls: [`${runtime.appOrigin}/*`] };
  saasSession.webRequest.onBeforeSendHeaders(requestFilter, (details, callback) => {
    callback({
      requestHeaders: {
        ...details.requestHeaders,
        "X-AngelCare-Desktop": "1",
        "X-AngelCare-Desktop-Version": app.getVersion(),
        "X-AngelCare-Desktop-Contract": runtime.desktopContractVersion,
        "X-AngelCare-Desktop-Channel": runtime.releaseChannel,
      },
    });
  });
  saasSession.webRequest.onHeadersReceived(requestFilter, (details, callback) => {
    callback({ responseHeaders: applySecurityHeaders(details.responseHeaders || {}, runtime) });
  });
  saasSession.setPermissionRequestHandler((webContents, permission, callback, details) => {
    let allowed = false;
    try {
      const requestingUrl = new URL(details.requestingUrl || webContents.getURL());
      allowed = requestingUrl.origin === runtime.appOrigin && permission === "notifications";
    } catch {
      allowed = false;
    }
    logger.info("permission_request", { permission, allowed });
    callback(allowed);
  });
  saasSession.setPermissionCheckHandler((_webContents, permission, requestingOrigin) => {
    try {
      return new URL(requestingOrigin).origin === runtime.appOrigin && permission === "notifications";
    } catch {
      return false;
    }
  });
  saasSession.on("will-download", (_event, item) => {
    logger.info("download_started", { filename: item.getFilename(), totalBytes: item.getTotalBytes(), sourceUrl: item.getURL() });
  });
  return saasSession;
}

function configureSaasView() {
  const wc = saasView.webContents;
  wc.setUserAgent(`${wc.getUserAgent()} AngelCareDesktop/${app.getVersion()}`);
  wc.setWindowOpenHandler(({ url }) => {
    if (isAllowedAppNavigation(url, runtime)) void wc.loadURL(url);
    else if (isSafeExternalUrl(url, runtime)) void shell.openExternal(url);
    return { action: "deny" };
  });
  wc.on("will-navigate", (event, url) => {
    if (isAllowedAppNavigation(url, runtime)) return;
    event.preventDefault();
    if (isSafeExternalUrl(url, runtime)) void shell.openExternal(url);
    logger.warn("navigation_blocked", { url });
  });
  wc.on("did-start-loading", () => {
    if (whatsappView) whatsappView.setVisible(false);
    sendShellState({ phase: "loading", message: "Connexion à ANGELCARE…", detail: runtime.appOrigin, online: null });
  });
  wc.on("did-finish-load", () => {
    clearTimeout(loadTimer);
    setSaasVisible(true);
    sendShellState({
      phase: "ready",
      message: "ANGELCARE est opérationnel",
      detail: null,
      online: true,
      loadedUrl: wc.getURL(),
      lastHealthyAt: new Date().toISOString(),
    });
    sendWhatsappState();
    if (governanceController) void governanceController.start();
    clearTimeout(healthyTimer);
    healthyTimer = setTimeout(() => startupRecoveryController?.markHealthy(), runtime.startupHealthyAfterMs);
    logger.info("saas_loaded", { url: wc.getURL() });
  });
  wc.on("did-fail-load", (_event, errorCode, errorDescription, validatedUrl, isMainFrame) => {
    if (!isMainFrame || errorCode === -3) return;
    clearTimeout(loadTimer);
    setSaasVisible(false);
    sendShellState({
      phase: "error",
      message: "Impossible de charger ANGELCARE",
      detail: `${errorDescription} (${errorCode})`,
      online: false,
      loadedUrl: validatedUrl || runtime.appUrl,
      lastErrorAt: new Date().toISOString(),
    });
    logger.warn("saas_load_failed", { errorCode, errorDescription, validatedUrl });
  });
  wc.on("unresponsive", () => {
    sendShellState({ phase: "unresponsive", message: "Le module ANGELCARE ne répond plus", detail: "Une relance contrôlée est disponible." });
    logger.warn("saas_unresponsive");
  });
  wc.on("responsive", () => {
    sendShellState({ phase: "ready", message: "ANGELCARE est de nouveau réactif", detail: null, online: true });
    logger.info("saas_responsive");
  });
  wc.on("render-process-gone", (_event, details) => {
    setSaasVisible(false);
    sendShellState({
      phase: "crashed",
      message: "Le moteur d’affichage ANGELCARE s’est arrêté",
      detail: `${details.reason}${details.exitCode !== undefined ? ` · code ${details.exitCode}` : ""}`,
      online: null,
      lastErrorAt: new Date().toISOString(),
    });
    logger.warn("saas_renderer_gone", details);
  });
}

async function checkHealth() {
  const healthUrl = new URL(runtime.healthPath, `${runtime.appUrl}/`).href;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Math.min(runtime.loadTimeoutMs, 15000));
  try {
    const response = await net.fetch(healthUrl, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
      headers: { "X-AngelCare-Desktop": "1", "X-AngelCare-Desktop-Version": app.getVersion() },
    });
    if (!response.ok) throw new Error(`Health endpoint returned HTTP ${response.status}`);
    const payload = await response.json();
    sendShellState({ online: Boolean(payload?.ok), lastHealthyAt: new Date().toISOString() });
    return true;
  } catch (error) {
    sendShellState({ online: false, lastErrorAt: new Date().toISOString() });
    logger.warn("health_check_failed", { message: error instanceof Error ? error.message : String(error) });
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

async function loadSaas({ hard = false, reason = "startup" } = {}) {
  if (!saasView || saasView.webContents.isDestroyed()) return;
  clearTimeout(loadTimer);
  hideWhatsappView("saas-load");
  sendShellState({ phase: "loading", message: "Connexion à ANGELCARE…", detail: runtime.appOrigin, online: null });
  logger.info("saas_load_requested", { hard, reason, url: runtime.appUrl });
  loadTimer = setTimeout(() => {
    setSaasVisible(false);
    sendShellState({
      phase: "timeout",
      message: "Le chargement ANGELCARE prend trop de temps",
      detail: "Vérifiez la connexion internet ou le serveur SaaS, puis réessayez.",
      online: false,
      lastErrorAt: new Date().toISOString(),
    });
  }, runtime.loadTimeoutMs);
  try {
    if (hard) await saasView.webContents.session.clearCache();
    await saasView.webContents.loadURL(runtime.appUrl);
  } catch (error) {
    logger.warn("saas_load_request_failed", {
      reason,
      url: runtime.appUrl,
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

function buildApplicationMenu() {
  const isMac = process.platform === "darwin";
  const template = [
    ...(isMac ? [{
      label: APP_NAME,
      submenu: [{ role: "about" }, { type: "separator" }, { role: "services" }, { type: "separator" }, { role: "hide" }, { role: "hideOthers" }, { role: "unhide" }, { type: "separator" }, { role: "quit" }],
    }] : []),
    {
      label: "Fichier",
      submenu: [
        { label: "Ouvrir ANGELCARE", accelerator: "CmdOrCtrl+Shift+O", click: () => void stationController?.corporateBrowser.activateTab("angelcare-system") },
        { label: "Ouvrir WhatsApp", accelerator: "CmdOrCtrl+Shift+W", click: () => void stationController?.corporateBrowser.activateTab("whatsapp-system") },
        { type: "separator" },
        isMac ? { role: "close" } : { role: "quit" },
      ],
    },
    {
      label: "WhatsApp",
      submenu: [
        { label: "Afficher le workspace", accelerator: "CmdOrCtrl+Alt+W", click: () => { void openWhatsappWorkspace("application-menu").catch((error) => logger.warn("whatsapp_workspace_menu_open_failed", { message: error instanceof Error ? error.message : String(error) })); } },
        { label: "Masquer le workspace", click: () => hideWhatsappView("menu") },
        { label: "Actualiser WhatsApp", click: () => whatsappView?.webContents.reload() },
        { label: "Redémarrer le moteur", click: () => void restartWhatsappView() },
        { type: "separator" },
        { label: "Ouvrir les téléchargements", click: () => void openWhatsappDownloadsFolder() },
      ],
    },
    {
      label: "Affichage",
      submenu: [
        { label: "Actualiser ANGELCARE", accelerator: "CmdOrCtrl+R", click: () => saasView?.webContents.reload() },
        { label: "Actualiser ANGELCARE sans cache", accelerator: "CmdOrCtrl+Shift+R", click: () => saasView?.webContents.reloadIgnoringCache() },
        { type: "separator" },
        { label: "Zoom 100 %", accelerator: "CmdOrCtrl+0", click: () => void stationController?.corporateBrowser.zoomReset() }, { label: "Zoom avant", accelerator: "CmdOrCtrl+Plus", click: () => void stationController?.corporateBrowser.zoomIn() }, { label: "Zoom arrière", accelerator: "CmdOrCtrl+-", click: () => void stationController?.corporateBrowser.zoomOut() }, { type: "separator" }, { label: "Plein écran", accelerator: "F11", click: () => { if (stationController?.getStatus()?.mode !== "locked") mainWindow?.setFullScreen?.(!mainWindow?.isFullScreen?.()); } },
        ...(runtime.isDevelopment ? [{ type: "separator" }, { role: "toggleDevTools" }] : []),
      ],
    },
    {
      label: "Fenêtre",
      submenu: [{ role: "minimize" }, { role: "zoom" }, ...(isMac ? [{ type: "separator" }, { role: "front" }] : [{ role: "close" }])],
    },
    {
      label: "Mises à jour",
      submenu: [
        { label: "Rechercher une mise à jour", click: () => void updateManager?.check() },
        { label: "Télécharger la mise à jour disponible", click: () => void updateManager?.download() },
        { label: "Afficher le fichier vérifié", click: () => void updateManager?.revealDownload() },
      ],
    },
    {
      role: "help",
      submenu: [
        { label: "Centre de contrôle production", click: () => void saasView?.webContents.loadURL(`${runtime.appUrl}/whatsapp-os/session-control`) },
        { label: "Exporter les diagnostics sécurisés", click: () => void diagnosticsController?.exportBundle() },
        { label: "État du runtime", click: () => { setSaasVisible(false); sendShellState({ phase: "diagnostics", message: "Diagnostic du runtime ANGELCARE", detail: `Version ${app.getVersion()} · ${runtime.releaseChannel}` }); } },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

async function createMainWindow() {
  const iconPath = path.join(__dirname, "..", "assets", "icon.png");
  mainWindow = new BaseWindow({
    title: APP_NAME,
    width: runtime.defaultWidth,
    height: runtime.defaultHeight,
    minWidth: runtime.minimumWidth,
    minHeight: runtime.minimumHeight,
    backgroundColor: "#f8fbff",
    icon: iconPath,
    show: false,
  });

  shellView = new WebContentsView({
    webPreferences: {
      preload: path.join(__dirname, "shell-preload.cjs"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      devTools: runtime.isDevelopment,
    },
  });
  shellView.setBackgroundColor("#f8fbff");

  const saasSession = configureSaasSession();
  saasView = new WebContentsView({
    webPreferences: {
      session: saasSession,
      preload: path.join(__dirname, "preload.cjs"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      devTools: runtime.isDevelopment,
      spellcheck: true,
      safeDialogs: true,
      safeDialogsMessage: "ANGELCARE a bloqué des dialogues répétés provenant de cette page.",
      additionalArguments: [
        `--angelcare-desktop-version=${app.getVersion()}`,
        `--angelcare-desktop-contract=${runtime.desktopContractVersion}`,
        `--angelcare-desktop-channel=${runtime.releaseChannel}`,
      ],
    },
  });
  saasView.setBackgroundColor("#ffffff");
  saasView.setVisible(false);

  mainWindow.contentView.addChildView(shellView);
  mainWindow.contentView.addChildView(saasView);
  configureSaasView();

  governanceController = createGovernanceController({
    app,
    runtime,
    saasSession: saasSessionRuntime,
    logger,
    publishState: sendGovernanceState,
    getWhatsappState: publicWhatsappState,
    actions: {
      hideWhatsapp: hideWhatsappView,
      reloadWhatsapp: async () => { await ensureWhatsappView({ load: true }); whatsappView.webContents.reload(); },
      restartWhatsapp: restartWhatsappView,
      clearWhatsappCache,
      clearWhatsappSession,
      logoutDesktop: async () => {
        hideWhatsappView("remote-logout");
        await saasSessionRuntime.clearStorageData({ storages: ["cookies", "localstorage", "indexdb", "cachestorage", "serviceworkers"] });
        await saasSessionRuntime.clearCache();
        await loadSaas({ hard: true, reason: "remote-governance-logout" });
      },
    },
  });

  stationController = createStationController({
    app,
    mainWindow,
    runtime,
    logger,
    dialog,
    shell,
    saasSession: saasSessionRuntime,
    getInstallationId: () => governanceController?.getInstallationId?.() || "unknown-installation",
    getDeviceId: () => governanceController?.getState?.()?.deviceId || null,
    getUserId: () => governanceController?.getState?.()?.assignment?.user_id || null,
    getCorporateBounds: () => {
      const contentBounds = mainWindow?.getContentBounds?.() || { width: 0, height: 0 };
      const toolbarHeight = Math.min(runtime.toolbarHeight, Math.max(0, contentBounds.height));
      return { x: 0, y: toolbarHeight, width: Math.max(0, Math.floor(contentBounds.width)), height: Math.max(0, Math.floor(contentBounds.height - toolbarHeight)) };
    },
    onStationState: sendStationState,
    onCorporateState: sendCorporateBrowserState,
    onActivateSystemTab: (type) => {
      activeDesktopSurface = type;
      if (type === "whatsapp-system") {
        void openWhatsappWorkspace("corporate-system-tab").catch((error) => logger.warn("station_whatsapp_system_tab_failed", { message: error.message }));
      } else {
        hideWhatsappView("corporate-system-tab");
        setSaasVisible(true);
      }
      sendShellState();
    },
    onActivateCorporateTab: (tab) => {
      activeDesktopSurface = tab.type || "corporate-web";
      hideWhatsappView("corporate-tab-active");
      setSaasVisible(false);
      sendShellState();
    },
    requestDiagnostics: () => diagnosticsController?.exportBundle(),
    restartDesktop: () => { app.relaunch(); app.exit(0); },
  });

  mainWindow.on("resize", layoutViews);
  mainWindow.on("maximize", layoutViews);
  mainWindow.on("unmaximize", layoutViews);
  mainWindow.on("enter-full-screen", layoutViews);
  mainWindow.on("leave-full-screen", layoutViews);
  mainWindow.on("close", (event) => {
    if (!isQuitting) persistWindowState(mainWindow.getBounds(), mainWindow.isMaximized());
    if (!isQuitting && stationController?.shouldBlockClose()) {
      event.preventDefault();
      if (!closeAuthorizationPending) {
        closeAuthorizationPending = true;
        void stationController.requestCloseAuthorization("window-close").then((result) => {
          if (result?.ok === false || result?.cancelled) return;
          stationAuthorizedQuit = true;
          isQuitting = true;
          app.quit();
        }).catch((error) => logger.warn("station_close_authorization_failed", { message: error.message })).finally(() => { closeAuthorizationPending = false; });
      }
    }
  });
  mainWindow.on("closed", () => {
    governanceController?.stop();
    stationController?.destroy();
    stationController = null;
    updateManager?.stop();
    clearInterval(healthTimer);
    clearTimeout(loadTimer);
    clearTimeout(healthyTimer);
    if (whatsappView && !whatsappView.webContents.isDestroyed()) whatsappView.webContents.close();
    if (shellView && !shellView.webContents.isDestroyed()) shellView.webContents.close();
    if (saasView && !saasView.webContents.isDestroyed()) saasView.webContents.close();
    whatsappView = null;
    shellView = null;
    saasView = null;
    mainWindow = null;
  });

  shellView.webContents.on("did-finish-load", () => {
    layoutViews();
    sendShellState();
    if (governanceController) sendGovernanceState(governanceController.getState());
    if (updateManager) sendReleaseState(updateManager.getState());
    if (stationController) sendStationState(stationController.getStatus());
    if (stationController) sendCorporateBrowserState(stationController.corporateBrowser.getState());
    mainWindow.show();
  });
  shellView.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  await shellView.webContents.loadURL(SHELL_URL);

  const persistedConfig = require("./runtime/config.cjs").readJson(runtime.configPath);
  if (persistedConfig.window?.maximized) mainWindow.maximize();

  await loadSaas({ reason: "startup" });
  await stationController.initialize();
  healthTimer = setInterval(() => void checkHealth(), runtime.healthCheckIntervalMs);
}

app.on("second-instance", () => {
  if (!mainWindow) return;
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.show();
  mainWindow.focus();
});

app.on("before-quit", (event) => {
  if (mainWindow && stationController?.shouldBlockClose() && !stationAuthorizedQuit) {
    event.preventDefault();
    if (!closeAuthorizationPending) {
      closeAuthorizationPending = true;
      void stationController.requestCloseAuthorization("application-quit").then((result) => {
        if (result?.ok === false || result?.cancelled) return;
        stationAuthorizedQuit = true;
        isQuitting = true;
        app.quit();
      }).catch((error) => logger?.warn("station_quit_authorization_failed", { message: error instanceof Error ? error.message : String(error) }))
        .finally(() => { closeAuthorizationPending = false; });
    }
    return;
  }
  isQuitting = true;
  updateManager?.stop();
  startupRecoveryController?.markCleanExit();
  if (mainWindow) persistWindowState(mainWindow.getBounds(), mainWindow.isMaximized());
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (!mainWindow) void createMainWindow();
  else mainWindow.show();
});

app.on("certificate-error", (event, _webContents, url, error, _certificate, callback) => {
  event.preventDefault();
  logger?.warn("certificate_error_blocked", { url, error });
  callback(false);
});

app.on("web-contents-created", (_event, contents) => {
  contents.on("will-attach-webview", (event) => {
    event.preventDefault();
    logger?.warn("webview_attachment_blocked");
  });
});

process.on("uncaughtException", (error) => logger?.error("uncaught_exception", error));
process.on("unhandledRejection", (reason) => logger?.error("unhandled_rejection", reason));

if (hasSingleInstanceLock) {
  void app.whenReady().then(async () => {
    app.setName(APP_NAME);
    if (process.platform === "win32") app.setAppUserModelId(APP_ID);
    const defaultsPath = path.join(__dirname, "..", "config", "defaults.json");
    const loaded = loadRuntimeConfig({ app, defaultsPath });
    runtime = loaded.runtime;
    persistWindowState = loaded.persistWindowState;
    logger = createLogger(path.join(app.getPath("userData"), "logs"), {
      maxLogBytes: runtime.logMaxBytes,
      maxArchives: runtime.logMaxArchives,
      retentionDays: runtime.diagnosticRetentionDays,
    });
    startupRecoveryController = createStartupRecoveryController({ app, logger, threshold: runtime.startupCrashLoopThreshold });
    updateManager = createUpdateManager({ app, runtime, logger, net, shell, dialog, publishState: sendReleaseState });
    diagnosticsController = createDiagnosticsController({
      app,
      dialog,
      runtime,
      logger,
      getRuntimeState: () => currentState,
      getWhatsappState: publicWhatsappState,
      getGovernanceState: () => governanceController?.getState() || null,
      getReleaseState: () => updateManager?.getState() || null,
      getStartupState: () => startupRecoveryController?.getState() || null,
    });

    crashReporter.start({
      productName: APP_NAME,
      companyName: "ANGELCARE",
      submitURL: "",
      uploadToServer: false,
      compress: true,
      ignoreSystemCrashHandler: false,
    });

    logger.info("runtime_start", desktopRuntimeInfo());
    await registerLocalShellProtocol();
    installIpcHandlers();
    buildApplicationMenu();
    updateManager.start();

    powerMonitor.on("resume", () => {
      logger.info("system_resume");
      void checkHealth().then((healthy) => {
        if (!healthy && saasView && !saasView.webContents.isDestroyed()) saasView.webContents.reload();
      });
      if (governanceController) void governanceController.refresh();
      if (stationController) void stationController.refreshPolicy({ source: "system-resume" }).then(() => stationController.heartbeat());
      if (whatsappView && whatsappRequestedVisible && governanceController?.canOpen()) whatsappView.webContents.reload();
    });
    powerMonitor.on("lock-screen", () => logger.info("screen_locked"));
    powerMonitor.on("unlock-screen", () => logger.info("screen_unlocked"));

    await createMainWindow();
  }).catch((error) => {
    logger?.error("runtime_boot_failure", error);
    app.quit();
  });
}
