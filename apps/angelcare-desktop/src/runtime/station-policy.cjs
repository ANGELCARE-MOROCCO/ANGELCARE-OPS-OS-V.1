"use strict";

const net = require("node:net");

const BLOCKED_SCHEMES = new Set([
  "javascript:", "data:", "file:", "chrome:", "chrome-extension:", "devtools:",
  "view-source:", "vbscript:", "blob:", "filesystem:", "about:",
]);
const DEFAULT_ALLOWED_SCHEMES = Object.freeze(["https:"]);
const DEFAULT_DANGEROUS_EXTENSIONS = Object.freeze([
  ".app", ".bat", ".cmd", ".com", ".cpl", ".dll", ".dmg", ".exe", ".hta",
  ".jar", ".js", ".jse", ".lnk", ".msi", ".msp", ".pif", ".ps1", ".reg",
  ".scr", ".vbe", ".vbs", ".wsf", ".wsh",
]);

const DEFAULT_STATION_POLICY = Object.freeze({
  schema_version: 1,
  policy_version: 1,
  mode: "standard",
  active: true,
  start_at_login: false,
  startup_surface: "angelcare-system",
  kiosk_enforcement: true,
  always_on_top: false,
  confirm_before_quit: true,
  restore_after_crash: true,
  relock_after_restart: true,
  relock_after_inactivity_minutes: 0,
  auto_relock_minutes: 0,
  pin_required: true,
  exit_reason_required: false,
  offline_unlock_permitted: true,
  failed_attempt_threshold: 5,
  lockout_duration_seconds: 300,
  browser_history_retention_days: 30,
  clear_browser_data_on_logout: false,
  restore_tabs: true,
  maximum_tabs: 12,
  external_browser_policy: "deny",
  external_application_policy: "deny",
  screenshot_policy: "application-best-effort",
  browser: {
    default_action: "deny",
    allowed_schemes: ["https:"],
    allowed_domains: [
      "angelcarehub.com",
      "opsmanagement.angelcarehub.com",
      "google.com",
      "www.google.com",
      "accounts.google.com",
      "mail.google.com",
      "gmail.com",
      "gstatic.com",
      "googleusercontent.com",
      "microsoft.com",
      "microsoftonline.com",
      "office.com",
      "office365.com",
      "live.com",
    ],
    blocked_domains: [],
    allowed_private_hosts: [],
    include_subdomains: true,
    google_search_enabled: true,
    gmail_enabled: true,
    microsoft_365_enabled: true,
    popups: "internal-tab",
    external_open: false,
    downloads: "confirm",
    uploads: "allow",
    printing: "allow",
    clipboard_read: "deny",
    clipboard_write: "allow",
    camera: "ask",
    microphone: "ask",
    notifications: "ask",
    geolocation: "deny",
    fullscreen: "allow",
    maximum_download_bytes: 262144000,
    safe_download_directory: "ANGELCARE Corporate Downloads",
    blocked_extensions: DEFAULT_DANGEROUS_EXTENSIONS,
    domain_permission_overrides: {},
    default_tabs: [],
    pinned_tabs: [],
    mandatory_tabs: [],
    tab_order: [],
  },
});

function clone(value) { return JSON.parse(JSON.stringify(value)); }
function safeString(value, max = 1000) { return String(value ?? "").trim().slice(0, max); }
function clampInteger(value, fallback, min, max) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.round(parsed)));
}
function normalizeHost(value) {
  return safeString(value, 253).toLowerCase().replace(/^\.+|\.+$/g, "").replace(/^www\./, "www.");
}
function normalizeHostList(value) {
  const source = Array.isArray(value) ? value : typeof value === "string" ? value.split(/[\s,]+/) : [];
  return [...new Set(source.map(normalizeHost).filter(Boolean))];
}
function normalizeStringList(value, maxLength = 200) {
  const source = Array.isArray(value) ? value : typeof value === "string" ? value.split(/[\n,]+/) : [];
  return [...new Set(source.map((item) => safeString(item, maxLength)).filter(Boolean))];
}
function normalizeMode(value) {
  const mode = safeString(value, 30).toLowerCase();
  return ["standard", "focus", "locked"].includes(mode) ? mode : "standard";
}
function mergeObjects(base, patch) {
  const output = clone(base);
  for (const [key, value] of Object.entries(patch && typeof patch === "object" ? patch : {})) {
    if (value && typeof value === "object" && !Array.isArray(value) && output[key] && typeof output[key] === "object" && !Array.isArray(output[key])) {
      output[key] = mergeObjects(output[key], value);
    } else if (value !== undefined) {
      output[key] = clone(value);
    }
  }
  return output;
}

function normalizeStationPolicy(raw = {}, previous = null) {
  const merged = mergeObjects(previous || DEFAULT_STATION_POLICY, raw);
  const browser = merged.browser || {};
  const mode = normalizeMode(merged.mode || merged.station_mode);
  const normalized = {
    ...merged,
    schema_version: 1,
    policy_version: clampInteger(merged.policy_version, 1, 1, Number.MAX_SAFE_INTEGER),
    mode,
    active: merged.active !== false,
    start_at_login: Boolean(merged.start_at_login),
    startup_surface: safeString(merged.startup_surface || "angelcare-system", 80),
    kiosk_enforcement: merged.kiosk_enforcement !== false,
    always_on_top: Boolean(merged.always_on_top),
    confirm_before_quit: merged.confirm_before_quit !== false,
    restore_after_crash: merged.restore_after_crash !== false,
    relock_after_restart: merged.relock_after_restart !== false,
    relock_after_inactivity_minutes: clampInteger(merged.relock_after_inactivity_minutes, 0, 0, 1440),
    auto_relock_minutes: clampInteger(merged.auto_relock_minutes, 0, 0, 1440),
    pin_required: merged.pin_required !== false,
    exit_reason_required: Boolean(merged.exit_reason_required),
    offline_unlock_permitted: merged.offline_unlock_permitted !== false,
    failed_attempt_threshold: clampInteger(merged.failed_attempt_threshold, 5, 1, 20),
    lockout_duration_seconds: clampInteger(merged.lockout_duration_seconds, 300, 15, 86400),
    browser_history_retention_days: clampInteger(merged.browser_history_retention_days, 30, 0, 3650),
    clear_browser_data_on_logout: Boolean(merged.clear_browser_data_on_logout),
    restore_tabs: merged.restore_tabs !== false,
    maximum_tabs: clampInteger(merged.maximum_tabs, 12, 2, 50),
    external_browser_policy: ["allow", "deny", "ask"].includes(merged.external_browser_policy) ? merged.external_browser_policy : "deny",
    external_application_policy: ["allow", "deny", "ask"].includes(merged.external_application_policy) ? merged.external_application_policy : "deny",
    browser: {
      ...browser,
      default_action: browser.default_action === "allow" ? "allow" : "deny",
      allowed_schemes: normalizeStringList(browser.allowed_schemes || DEFAULT_ALLOWED_SCHEMES, 30).filter((value) => !BLOCKED_SCHEMES.has(value)),
      allowed_domains: normalizeHostList(browser.allowed_domains),
      blocked_domains: normalizeHostList(browser.blocked_domains),
      allowed_private_hosts: normalizeHostList(browser.allowed_private_hosts),
      include_subdomains: browser.include_subdomains !== false,
      google_search_enabled: browser.google_search_enabled !== false,
      gmail_enabled: browser.gmail_enabled !== false,
      microsoft_365_enabled: browser.microsoft_365_enabled !== false,
      popups: ["deny", "internal-tab"].includes(browser.popups) ? browser.popups : "deny",
      external_open: Boolean(browser.external_open),
      downloads: ["deny", "allow", "confirm"].includes(browser.downloads) ? browser.downloads : "confirm",
      uploads: ["deny", "allow"].includes(browser.uploads) ? browser.uploads : "allow",
      printing: ["deny", "allow"].includes(browser.printing) ? browser.printing : "allow",
      clipboard_read: ["deny", "allow", "ask"].includes(browser.clipboard_read) ? browser.clipboard_read : "deny",
      clipboard_write: ["deny", "allow", "ask"].includes(browser.clipboard_write) ? browser.clipboard_write : "allow",
      camera: ["deny", "allow", "ask"].includes(browser.camera) ? browser.camera : "ask",
      microphone: ["deny", "allow", "ask"].includes(browser.microphone) ? browser.microphone : "ask",
      notifications: ["deny", "allow", "ask"].includes(browser.notifications) ? browser.notifications : "ask",
      geolocation: ["deny", "allow", "ask"].includes(browser.geolocation) ? browser.geolocation : "deny",
      fullscreen: ["deny", "allow"].includes(browser.fullscreen) ? browser.fullscreen : "allow",
      maximum_download_bytes: clampInteger(browser.maximum_download_bytes, 262144000, 1048576, 2147483648),
      safe_download_directory: safeString(browser.safe_download_directory || "ANGELCARE Corporate Downloads", 80).replace(/[<>:\"/\\|?*]/g, "-") || "ANGELCARE Corporate Downloads",
      blocked_extensions: normalizeStringList(browser.blocked_extensions || DEFAULT_DANGEROUS_EXTENSIONS, 20).map((value) => value.startsWith(".") ? value.toLowerCase() : `.${value.toLowerCase()}`),
      domain_permission_overrides: browser.domain_permission_overrides && typeof browser.domain_permission_overrides === "object" ? clone(browser.domain_permission_overrides) : {},
      default_tabs: normalizeTabTemplates(browser.default_tabs),
      pinned_tabs: normalizeTabTemplates(browser.pinned_tabs),
      mandatory_tabs: normalizeTabTemplates(browser.mandatory_tabs),
      tab_order: normalizeStringList(browser.tab_order, 120),
    },
  };
  if (!normalized.browser.allowed_schemes.length) normalized.browser.allowed_schemes = ["https:"];
  return Object.freeze(normalized);
}

function normalizeTabTemplates(value) {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 50).map((entry, index) => {
    if (typeof entry === "string") return { id: `template-${index}`, title: entry, url: entry, pinned: false, mandatory: false };
    return {
      id: safeString(entry?.id || `template-${index}`, 120),
      title: safeString(entry?.title || entry?.name || "Corporate", 180),
      url: safeString(entry?.url, 2048),
      pinned: Boolean(entry?.pinned),
      mandatory: Boolean(entry?.mandatory),
      order: clampInteger(entry?.order, index, 0, 10000),
      allowed_modes: normalizeStringList(entry?.allowed_modes || ["standard", "focus", "locked"], 30).filter((mode) => ["standard", "focus", "locked"].includes(mode)),
    };
  }).filter((entry) => entry.url);
}

function hostMatchesRule(hostname, rule, includeSubdomains = true) {
  const host = normalizeHost(hostname);
  const normalizedRule = normalizeHost(rule).replace(/^\*\./, "");
  if (!host || !normalizedRule) return false;
  if (host === normalizedRule) return true;
  return includeSubdomains && host.endsWith(`.${normalizedRule}`);
}

function isPrivateHost(hostname) {
  const host = normalizeHost(hostname);
  if (["localhost", "localhost.localdomain", "::1"].includes(host)) return true;
  const family = net.isIP(host);
  if (family === 4) {
    const parts = host.split(".").map(Number);
    return parts[0] === 10
      || parts[0] === 127
      || (parts[0] === 169 && parts[1] === 254)
      || (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31)
      || (parts[0] === 192 && parts[1] === 168);
  }
  if (family === 6) return host === "::1" || host.startsWith("fc") || host.startsWith("fd") || host.startsWith("fe80:");
  return host.endsWith(".local") || host.endsWith(".internal");
}

function looksLikeUrl(value) {
  const text = safeString(value, 4096);
  if (/^[a-z][a-z0-9+.-]*:/i.test(text)) return true;
  if (/^(localhost|\[[0-9a-f:]+\]|\d{1,3}(?:\.\d{1,3}){3})(?::\d+)?(?:\/|$)/i.test(text)) return true;
  return /^[^\s/]+\.[a-z]{2,}(?::\d+)?(?:\/|$)/i.test(text);
}

function normalizeAddressInput(input, policy, options = {}) {
  const text = safeString(input, 4096);
  if (!text) return { ok: true, kind: "new-tab", url: options.newTabUrl || "angelcare-desktop://newtab/index.html" };
  if (!looksLikeUrl(text)) {
    if (policy.browser.google_search_enabled === false) return { ok: false, reason: "GOOGLE_SEARCH_DISABLED", input: text };
    return { ok: true, kind: "search", url: `https://www.google.com/search?q=${encodeURIComponent(text)}` };
  }
  let prepared = text;
  if (!/^[a-z][a-z0-9+.-]*:/i.test(prepared)) prepared = `https://${prepared}`;
  let url;
  try { url = new URL(prepared); } catch { return { ok: false, reason: "MALFORMED_URL", input: text }; }
  if (url.protocol === "http:" && !isPrivateHost(url.hostname)) url.protocol = "https:";
  return { ok: true, kind: "url", url: url.href };
}

function evaluateUrl(input, rawPolicy = DEFAULT_STATION_POLICY, options = {}) {
  const policy = normalizeStationPolicy(rawPolicy);
  const normalizedInput = normalizeAddressInput(input, policy, options);
  if (!normalizedInput.ok) return { allowed: false, reason: normalizedInput.reason, normalizedUrl: null, trust: "blocked" };
  if (normalizedInput.kind === "new-tab") return { allowed: true, reason: "LOCAL_NEW_TAB", normalizedUrl: normalizedInput.url, trust: "local" };
  let url;
  try { url = new URL(normalizedInput.url); } catch { return { allowed: false, reason: "MALFORMED_URL", normalizedUrl: null, trust: "blocked" }; }
  if (url.protocol === "angelcare-desktop:" && options.allowLocalPages === true) {
    return { allowed: true, reason: "LOCAL_TRUSTED_PAGE", normalizedUrl: url.href, trust: "local" };
  }
  if (BLOCKED_SCHEMES.has(url.protocol) || !policy.browser.allowed_schemes.includes(url.protocol)) {
    return { allowed: false, reason: "SCHEME_BLOCKED", normalizedUrl: url.href, trust: "blocked" };
  }
  const host = normalizeHost(url.hostname);
  if (!host) return { allowed: false, reason: "HOST_REQUIRED", normalizedUrl: url.href, trust: "blocked" };
  if (isPrivateHost(host) && !policy.browser.allowed_private_hosts.some((rule) => hostMatchesRule(host, rule, true))) {
    return { allowed: false, reason: "PRIVATE_HOST_BLOCKED", normalizedUrl: url.href, trust: "blocked" };
  }
  if (policy.browser.blocked_domains.some((rule) => hostMatchesRule(host, rule, true))) {
    return { allowed: false, reason: "DOMAIN_BLOCKED", normalizedUrl: url.href, trust: "blocked" };
  }
  const angelcare = host === "angelcarehub.com" || host.endsWith(".angelcarehub.com");
  const whatsapp = host === "whatsapp.com" || host.endsWith(".whatsapp.com");
  const explicitlyAllowed = policy.browser.allowed_domains.some((rule) => hostMatchesRule(host, rule, policy.browser.include_subdomains));
  const allowed = angelcare || whatsapp || explicitlyAllowed || policy.browser.default_action === "allow";
  return {
    allowed,
    reason: allowed ? (angelcare ? "TRUSTED_ANGELCARE" : whatsapp ? "TRUSTED_WHATSAPP" : explicitlyAllowed ? "DOMAIN_ALLOWED" : "DEFAULT_ALLOW") : "DOMAIN_NOT_APPROVED",
    normalizedUrl: url.href,
    trust: angelcare ? "angelcare" : whatsapp ? "whatsapp" : explicitlyAllowed ? "corporate" : allowed ? "unclassified" : "blocked",
    host,
  };
}

function permissionRuleFor(permission, policy, origin) {
  const browser = normalizeStationPolicy(policy).browser;
  let host = "";
  try { host = normalizeHost(new URL(origin).hostname); } catch { return "deny"; }
  const override = Object.entries(browser.domain_permission_overrides || {}).find(([rule]) => hostMatchesRule(host, rule, true))?.[1];
  const mediaMap = {
    notifications: "notifications",
    media: "media",
    microphone: "microphone",
    camera: "camera",
    geolocation: "geolocation",
    "clipboard-read": "clipboard_read",
    "clipboard-sanitized-write": "clipboard_write",
    fullscreen: "fullscreen",
    fileSystem: "uploads",
    fileSystemAccess: "uploads",
  };
  const key = mediaMap[permission] || permission;
  const value = override && typeof override === "object" && key in override ? override[key] : browser[key];
  return ["allow", "ask", "deny"].includes(value) ? value : "deny";
}

function downloadDecision(filename, totalBytes, policy) {
  const browser = normalizeStationPolicy(policy).browser;
  const extension = safeString(filename, 500).toLowerCase().match(/\.[^.]+$/)?.[0] || "";
  if (browser.downloads === "deny") return { allowed: false, confirmation: false, reason: "DOWNLOADS_DISABLED" };
  if (Number(totalBytes) > browser.maximum_download_bytes) return { allowed: false, confirmation: false, reason: "DOWNLOAD_TOO_LARGE" };
  if (extension && browser.blocked_extensions.includes(extension)) return { allowed: false, confirmation: false, reason: "DANGEROUS_FILE_TYPE" };
  return { allowed: true, confirmation: browser.downloads === "confirm", reason: "DOWNLOAD_ALLOWED" };
}

module.exports = {
  BLOCKED_SCHEMES,
  DEFAULT_DANGEROUS_EXTENSIONS,
  DEFAULT_STATION_POLICY,
  downloadDecision,
  evaluateUrl,
  hostMatchesRule,
  isPrivateHost,
  normalizeAddressInput,
  normalizeHost,
  normalizeStationPolicy,
  permissionRuleFor,
};
