"use strict";

const path = require("node:path");

const SENSITIVE_KEY = /(authorization|cookie|token|secret|password|passwd|private[_-]?key|session[_-]?key|indexeddb|localstorage|serviceworker|credential)/i;
const PATH_KEY = /(savepath|storagepath|filepath|directory|homepath)/i;
const JWT_PATTERN = /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g;
const BEARER_PATTERN = /\bBearer\s+[A-Za-z0-9._~+\/-]+=*/gi;
const QUERY_SENSITIVE = new Set(["text", "token", "access_token", "refresh_token", "code", "state", "key", "password"]);

function sanitizeUrl(value) {
  try {
    const url = new URL(String(value));
    for (const key of [...url.searchParams.keys()]) {
      if (QUERY_SENSITIVE.has(key.toLowerCase())) url.searchParams.set(key, "[REDACTED]");
    }
    if (url.hostname.endsWith("whatsapp.com")) {
      url.search = "";
      url.hash = "";
    }
    return url.toString();
  } catch {
    return scrubString(value);
  }
}

function scrubString(value) {
  return String(value ?? "")
    .replace(JWT_PATTERN, "[REDACTED_JWT]")
    .replace(BEARER_PATTERN, "Bearer [REDACTED]")
    .slice(0, 12_000);
}

function sanitizeValue(value, key = "", depth = 0) {
  if (depth > 8) return "[MAX_DEPTH]";
  if (SENSITIVE_KEY.test(key)) return "[REDACTED]";
  if (value === null || value === undefined) return value;
  if (typeof value === "string") {
    if (/url$/i.test(key) || /^url$/i.test(key)) return sanitizeUrl(value);
    if (PATH_KEY.test(key)) return path.basename(value) || "[LOCAL_PATH]";
    return scrubString(value);
  }
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (value instanceof Error) return { name: value.name, message: scrubString(value.message) };
  if (Array.isArray(value)) return value.slice(0, 100).map((entry) => sanitizeValue(entry, key, depth + 1));
  if (typeof value === "object") {
    const output = {};
    for (const [childKey, childValue] of Object.entries(value).slice(0, 200)) {
      output[childKey] = sanitizeValue(childValue, childKey, depth + 1);
    }
    return output;
  }
  return scrubString(value);
}

function sanitizeFilename(value, fallback = "download") {
  const base = path.basename(String(value || fallback)).normalize("NFKC");
  const cleaned = base
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/[<>:"/\\|?*]/g, "-")
    .replace(/^\.+/, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180);
  return cleaned || fallback;
}

function buildSaasCsp(runtime) {
  const origin = runtime.appOrigin;
  const directives = [
    "default-src 'self' https: data: blob:",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self' https:",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https: blob:",
    "style-src 'self' 'unsafe-inline' https:",
    "img-src 'self' https: data: blob:",
    "font-src 'self' https: data:",
    "connect-src 'self' https: wss:",
    "media-src 'self' https: data: blob:",
    "worker-src 'self' blob:",
    "child-src 'self' https: blob:",
    "upgrade-insecure-requests",
  ];
  return { origin, value: directives.join("; ") };
}

function applySecurityHeaders(responseHeaders = {}, runtime) {
  const headers = { ...responseHeaders };
  const csp = buildSaasCsp(runtime).value;
  const mode = runtime.securityCspMode === "enforce" ? "Content-Security-Policy" : "Content-Security-Policy-Report-Only";
  if (!headers["content-security-policy"] && !headers["Content-Security-Policy"] && !headers[mode]) headers[mode] = [csp];
  headers["X-Content-Type-Options"] = ["nosniff"];
  headers["Referrer-Policy"] = ["strict-origin-when-cross-origin"];
  headers["Permissions-Policy"] = ["camera=(), microphone=(), geolocation=(), usb=(), serial=(), hid=(), payment=(), interest-cohort=()"];
  return headers;
}

function canonicalJson(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
}

module.exports = {
  applySecurityHeaders,
  buildSaasCsp,
  canonicalJson,
  sanitizeFilename,
  sanitizeUrl,
  sanitizeValue,
  scrubString,
};
