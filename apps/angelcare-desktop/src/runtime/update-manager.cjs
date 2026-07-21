"use strict";

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { canonicalJson, sanitizeFilename, sanitizeValue } = require("./security.cjs");

function parseVersion(value) {
  const match = String(value || "").trim().match(/^(\d+)\.(\d+)\.(\d+)(?:[-+]([0-9A-Za-z.-]+))?$/);
  if (!match) return null;
  return { major: Number(match[1]), minor: Number(match[2]), patch: Number(match[3]), prerelease: match[4] || "" };
}

function compareVersions(left, right) {
  const a = parseVersion(left);
  const b = parseVersion(right);
  if (!a || !b) throw new Error("INVALID_SEMANTIC_VERSION");
  for (const key of ["major", "minor", "patch"]) if (a[key] !== b[key]) return a[key] > b[key] ? 1 : -1;
  if (a.prerelease === b.prerelease) return 0;
  if (!a.prerelease) return 1;
  if (!b.prerelease) return -1;
  return a.prerelease.localeCompare(b.prerelease);
}

function assertHttpsAllowed(rawUrl, allowedHosts) {
  const url = new URL(rawUrl);
  if (url.protocol !== "https:") throw new Error("UPDATE_URL_MUST_USE_HTTPS");
  const host = url.hostname.toLowerCase();
  const allowed = allowedHosts.some((entry) => host === entry || host.endsWith(`.${entry}`));
  if (!allowed) throw new Error("UPDATE_HOST_NOT_ALLOWLISTED");
  return url;
}

function validateManifest(input, runtime, appVersion) {
  if (!input || typeof input !== "object") throw new Error("INVALID_UPDATE_MANIFEST");
  const manifest = sanitizeValue(input);
  if (!parseVersion(manifest.version)) throw new Error("INVALID_UPDATE_VERSION");
  if (manifest.channel !== runtime.releaseChannel) throw new Error("UPDATE_CHANNEL_MISMATCH");
  const platform = manifest.platforms?.[process.platform]?.[process.arch];
  if (!platform) throw new Error("UPDATE_PLATFORM_NOT_AVAILABLE");
  const url = assertHttpsAllowed(platform.url, runtime.updateAllowedHosts);
  if (!/^[a-f0-9]{64}$/i.test(String(platform.sha256 || ""))) throw new Error("INVALID_UPDATE_CHECKSUM");
  if (!Number.isFinite(Number(platform.size)) || Number(platform.size) <= 0) throw new Error("INVALID_UPDATE_SIZE");
  const filename = sanitizeFilename(platform.filename || path.basename(url.pathname), process.platform === "win32" ? "ANGELCARE-Desktop-Setup.exe" : "ANGELCARE-Desktop.dmg");
  const newer = compareVersions(manifest.version, appVersion) > 0;
  return { ...manifest, platform: { ...platform, url: url.href, filename, size: Number(platform.size) }, newer };
}

function verifyManifestSignature(manifest, publicKeyPem) {
  if (!publicKeyPem) return { configured: false, valid: null };
  const signature = manifest.signature;
  if (!signature) throw new Error("UPDATE_MANIFEST_SIGNATURE_REQUIRED");
  const unsigned = { ...manifest };
  delete unsigned.signature;
  const valid = crypto.verify(null, Buffer.from(canonicalJson(unsigned)), publicKeyPem, Buffer.from(signature, "base64"));
  if (!valid) throw new Error("UPDATE_MANIFEST_SIGNATURE_INVALID");
  return { configured: true, valid: true };
}

function createUpdateManager({ app, runtime, logger, net, shell, dialog, publishState }) {
  let timer = null;
  let state = {
    available: Boolean(runtime.updateManifestUrl),
    phase: runtime.updateManifestUrl ? "idle" : "disabled",
    message: runtime.updateManifestUrl ? "Mise à jour non vérifiée." : "Canal de mise à jour non configuré.",
    detail: null,
    currentVersion: app.getVersion(),
    availableVersion: null,
    releaseChannel: runtime.releaseChannel,
    mandatory: false,
    progress: 0,
    downloadedBytes: 0,
    totalBytes: 0,
    downloadedPath: null,
    lastCheckedAt: null,
    lastErrorAt: null,
    signatureConfigured: Boolean(runtime.updatePublicKeyPem),
    signatureValid: null,
    manifest: null,
  };

  function update(patch = {}) {
    state = { ...state, ...patch, timestamp: new Date().toISOString() };
    publishState?.(getState());
    return getState();
  }
  function getState() { return sanitizeValue(state); }

  async function check({ silent = false } = {}) {
    if (!runtime.updateManifestUrl) return update({ phase: "disabled", message: "Canal de mise à jour non configuré." });
    const manifestUrl = assertHttpsAllowed(runtime.updateManifestUrl, runtime.updateAllowedHosts);
    update({ phase: "checking", message: "Recherche d’une mise à jour…", detail: null, progress: 0 });
    try {
      const response = await net.fetch(manifestUrl.href, { method: "GET", cache: "no-store", headers: { "X-AngelCare-Desktop-Version": app.getVersion(), "X-AngelCare-Desktop-Channel": runtime.releaseChannel } });
      if (!response.ok) throw new Error(`UPDATE_MANIFEST_HTTP_${response.status}`);
      const raw = await response.json();
      const signature = verifyManifestSignature(raw, runtime.updatePublicKeyPem);
      const manifest = validateManifest(raw, runtime, app.getVersion());
      const minBlocked = manifest.minimumSupportedVersion && compareVersions(app.getVersion(), manifest.minimumSupportedVersion) < 0;
      const mandatory = Boolean(manifest.mandatory || minBlocked);
      logger.info("update_check_completed", { version: manifest.version, newer: manifest.newer, mandatory, signatureConfigured: signature.configured });
      return update({
        phase: manifest.newer ? "available" : "up-to-date",
        message: manifest.newer ? `ANGELCARE Desktop ${manifest.version} est disponible.` : "ANGELCARE Desktop est à jour.",
        detail: manifest.releaseNotes || null,
        availableVersion: manifest.version,
        mandatory,
        lastCheckedAt: new Date().toISOString(),
        lastErrorAt: null,
        signatureConfigured: signature.configured,
        signatureValid: signature.valid,
        manifest,
      });
    } catch (error) {
      logger.warn("update_check_failed", { message: error.message });
      return update({ phase: "error", message: silent ? "Vérification de mise à jour indisponible." : "Impossible de vérifier les mises à jour.", detail: error.message, lastErrorAt: new Date().toISOString() });
    }
  }

  async function download() {
    const manifest = state.manifest;
    if (!manifest?.newer || !manifest.platform) throw new Error("NO_UPDATE_AVAILABLE");
    const artifact = manifest.platform;
    const targetDirectory = path.join(app.getPath("userData"), "updates", manifest.version);
    fs.mkdirSync(targetDirectory, { recursive: true, mode: 0o700 });
    const temporary = path.join(targetDirectory, `${artifact.filename}.part`);
    const destination = path.join(targetDirectory, artifact.filename);
    fs.rmSync(temporary, { force: true });
    update({ phase: "downloading", message: `Téléchargement de la version ${manifest.version}…`, progress: 0, downloadedBytes: 0, totalBytes: artifact.size });
    try {
      const response = await net.fetch(artifact.url, { method: "GET", cache: "no-store" });
      if (!response.ok || !response.body) throw new Error(`UPDATE_DOWNLOAD_HTTP_${response.status}`);
      const handle = fs.openSync(temporary, "w", 0o600);
      const hash = crypto.createHash("sha256");
      let received = 0;
      try {
        const reader = response.body.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = Buffer.from(value);
          fs.writeSync(handle, chunk);
          hash.update(chunk);
          received += chunk.length;
          update({ downloadedBytes: received, totalBytes: artifact.size, progress: Math.min(100, Math.round((received / artifact.size) * 100)) });
        }
      } finally {
        fs.closeSync(handle);
      }
      const digest = hash.digest("hex");
      if (received !== artifact.size) throw new Error(`UPDATE_SIZE_MISMATCH_${received}_${artifact.size}`);
      if (digest.toLowerCase() !== artifact.sha256.toLowerCase()) throw new Error("UPDATE_CHECKSUM_MISMATCH");
      fs.renameSync(temporary, destination);
      logger.info("update_download_verified", { version: manifest.version, filename: artifact.filename, size: received });
      return update({ phase: "downloaded", message: "Mise à jour téléchargée et vérifiée.", detail: "Le redémarrage doit être validé par l’utilisateur.", progress: 100, downloadedBytes: received, downloadedPath: destination });
    } catch (error) {
      fs.rmSync(temporary, { force: true });
      logger.warn("update_download_failed", { message: error.message });
      return update({ phase: "error", message: "Le téléchargement de la mise à jour a échoué.", detail: error.message, lastErrorAt: new Date().toISOString() });
    }
  }

  async function restartToUpdate() {
    if (!state.downloadedPath || !fs.existsSync(state.downloadedPath)) throw new Error("VERIFIED_UPDATE_NOT_FOUND");
    const confirmation = await dialog.showMessageBox({
      type: "question",
      buttons: ["Annuler", "Installer et fermer ANGELCARE Desktop"],
      defaultId: 1,
      cancelId: 0,
      title: "Installer la mise à jour ANGELCARE Desktop",
      message: `Installer la version ${state.availableVersion || "téléchargée"} ?`,
      detail: "Le fichier a été téléchargé et son empreinte SHA-256 a été vérifiée. L’installateur du système sera ouvert.",
      noLink: true,
    });
    if (confirmation.response !== 1) return { cancelled: true, state: getState() };
    const error = await shell.openPath(state.downloadedPath);
    if (error) throw new Error(`UPDATE_INSTALLER_OPEN_FAILED: ${error}`);
    logger.info("update_installer_opened", { version: state.availableVersion, filename: path.basename(state.downloadedPath) });
    update({ phase: "installing", message: "Installateur ouvert. ANGELCARE Desktop va se fermer.", detail: null });
    setTimeout(() => app.quit(), 1200);
    return { cancelled: false, state: getState() };
  }

  async function revealDownload() {
    if (!state.downloadedPath || !fs.existsSync(state.downloadedPath)) throw new Error("VERIFIED_UPDATE_NOT_FOUND");
    shell.showItemInFolder(state.downloadedPath);
    return getState();
  }

  function start() {
    stop();
    if (runtime.updateAutoCheck && runtime.updateManifestUrl) {
      setTimeout(() => void check({ silent: true }), 15_000);
      timer = setInterval(() => void check({ silent: true }), Math.max(3_600_000, runtime.updateCheckIntervalMs));
    }
  }
  function stop() { if (timer) clearInterval(timer); timer = null; }

  return { getState, check, download, restartToUpdate, revealDownload, start, stop };
}

module.exports = { assertHttpsAllowed, compareVersions, createUpdateManager, parseVersion, validateManifest, verifyManifestSignature };
