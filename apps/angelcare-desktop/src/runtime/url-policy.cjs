"use strict";

function normalizeHost(hostname) {
  return String(hostname || "").trim().toLowerCase().replace(/^\.+|\.+$/g, "");
}

function isLoopbackHost(hostname) {
  const host = normalizeHost(hostname);
  return host === "localhost" || host === "127.0.0.1" || host === "::1";
}

function parseHttpUrl(value, { allowLocalHttp = false } = {}) {
  let url;
  try {
    url = new URL(String(value || "").trim());
  } catch {
    throw new Error(`Invalid ANGELCARE application URL: ${String(value || "")}`);
  }

  if (url.protocol === "https:") return url;
  if (allowLocalHttp && url.protocol === "http:" && isLoopbackHost(url.hostname)) return url;

  throw new Error("The desktop runtime accepts HTTPS URLs, or HTTP only for localhost development.");
}

function parseAllowedHosts(csv, primaryUrl) {
  const values = String(csv || "")
    .split(",")
    .map(normalizeHost)
    .filter(Boolean);

  const hosts = new Set([normalizeHost(primaryUrl.hostname), ...values]);
  return [...hosts];
}

function hostMatches(hostname, allowedHosts) {
  const host = normalizeHost(hostname);
  return allowedHosts.some((allowedValue) => {
    const allowed = normalizeHost(allowedValue);
    return host === allowed || host.endsWith(`.${allowed}`);
  });
}

function isAllowedAppNavigation(rawUrl, runtime) {
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    return false;
  }

  if (url.protocol === "about:" && url.href === "about:blank") return true;
  if (url.protocol !== "https:" && !(runtime.isDevelopment && url.protocol === "http:" && isLoopbackHost(url.hostname))) {
    return false;
  }

  return hostMatches(url.hostname, runtime.allowedHosts);
}

function isSafeExternalUrl(rawUrl, runtime) {
  try {
    const url = new URL(rawUrl);
    return runtime.allowedExternalProtocols.includes(url.protocol);
  } catch {
    return false;
  }
}

module.exports = {
  hostMatches,
  isAllowedAppNavigation,
  isLoopbackHost,
  isSafeExternalUrl,
  normalizeHost,
  parseAllowedHosts,
  parseHttpUrl,
};
