"use strict";

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { BrowserWindow, ipcMain, safeStorage } = require("electron");

const UNLOCK_SUBMIT_CHANNEL = "angelcare-desktop:station-unlock-submit";
const UNLOCK_CANCEL_CHANNEL = "angelcare-desktop:station-unlock-cancel";
const UNLOCK_STATUS_CHANNEL = "angelcare-desktop:station-unlock-status";

function nowIso() { return new Date().toISOString(); }
function safeString(value, max = 1000) { return String(value ?? "").trim().slice(0, max); }
function clone(value) { return JSON.parse(JSON.stringify(value)); }
function timingEqual(left, right) {
  const a = Buffer.from(String(left || ""), "hex");
  const b = Buffer.from(String(right || ""), "hex");
  return a.length === b.length && a.length > 0 && crypto.timingSafeEqual(a, b);
}
function derive(secret, salt, workFactor = 16384) {
  return crypto.scryptSync(String(secret), Buffer.from(String(salt), "base64"), 32, { N: Math.max(16384, Number(workFactor) || 16384), r: 8, p: 1 }).toString("hex");
}

function createStationUnlockController(options) {
  const {
    app,
    parentWindow,
    logger,
    localUrl = "angelcare-desktop://unlock/index.html",
    getPolicy,
    verifyOnline,
    onUnlocked,
    onAttempt,
    onCancelled,
  } = options;
  const statePath = path.join(app.getPath("userData"), "station-unlock-state.json");
  let unlockWindow = null;
  let activeRequest = null;
  let handlersInstalled = false;
  let state = {
    failedAttempts: 0,
    lockoutUntil: null,
    lastAttemptAt: null,
    lastSuccessAt: null,
    lastOfflineSuccessAt: null,
    credentialVersion: null,
    offlineVerifierAvailable: false,
    recoveryCodesAvailable: 0,
  };

  function readLocal() {
    try {
      const stored = JSON.parse(fs.readFileSync(statePath, "utf8"));
      state = { ...state, ...(stored.state || {}) };
      return stored;
    } catch { return {}; }
  }
  let local = readLocal();

  function writeLocal() {
    fs.mkdirSync(path.dirname(statePath), { recursive: true, mode: 0o700 });
    const temporary = `${statePath}.tmp`;
    fs.writeFileSync(temporary, `${JSON.stringify({ schemaVersion: 1, state, verifier: local.verifier || null, recovery: local.recovery || [], updatedAt: nowIso() }, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
    fs.renameSync(temporary, statePath);
  }

  function encrypt(value) {
    const text = JSON.stringify(value);
    if (safeStorage.isEncryptionAvailable()) return { mode: "safeStorage", value: safeStorage.encryptString(text).toString("base64") };
    return { mode: "unavailable", value: null };
  }
  function decrypt(envelope) {
    if (!envelope || envelope.mode !== "safeStorage" || !envelope.value || !safeStorage.isEncryptionAvailable()) return null;
    try { return JSON.parse(safeStorage.decryptString(Buffer.from(envelope.value, "base64"))); } catch { return null; }
  }

  function publicStatus(patch = {}) {
    const lockoutMs = state.lockoutUntil ? Math.max(0, new Date(state.lockoutUntil).getTime() - Date.now()) : 0;
    return Object.freeze({
      available: true,
      failedAttempts: state.failedAttempts,
      lockoutUntil: lockoutMs > 0 ? state.lockoutUntil : null,
      remainingLockoutSeconds: Math.ceil(lockoutMs / 1000),
      lastAttemptAt: state.lastAttemptAt,
      lastSuccessAt: state.lastSuccessAt,
      lastOfflineSuccessAt: state.lastOfflineSuccessAt,
      credentialVersion: state.credentialVersion,
      offlineVerifierAvailable: Boolean(decrypt(local.verifier)),
      recoveryCodesAvailable: (local.recovery || []).filter((entry) => !entry.used_at && (!entry.expires_at || new Date(entry.expires_at).getTime() > Date.now())).length,
      open: Boolean(unlockWindow && !unlockWindow.isDestroyed()),
      ...patch,
      timestamp: nowIso(),
    });
  }

  function sendStatus(patch = {}) {
    const status = publicStatus(patch);
    if (unlockWindow && !unlockWindow.isDestroyed()) unlockWindow.webContents.send(UNLOCK_STATUS_CHANNEL, status);
    return status;
  }

  function validateSender(event) {
    return Boolean(unlockWindow && !unlockWindow.isDestroyed() && event.sender.id === unlockWindow.webContents.id);
  }

  function installHandlers() {
    if (handlersInstalled) return;
    handlersInstalled = true;
    ipcMain.handle(UNLOCK_SUBMIT_CHANNEL, async (event, payload) => {
      if (!validateSender(event)) throw new Error("UNAUTHORIZED_UNLOCK_SENDER");
      return submit(payload || {});
    });
    ipcMain.handle(UNLOCK_CANCEL_CHANNEL, async (event) => {
      if (!validateSender(event)) throw new Error("UNAUTHORIZED_UNLOCK_SENDER");
      const policy = getPolicy();
      if (policy.mode === "locked") {
        onCancelled?.();
        sendStatus({ message: "Déverrouillage annulé. Le poste reste verrouillé." });
        return { cancelled: true, locked: true };
      }
      closeWindow();
      return { cancelled: true, locked: false };
    });
  }

  function cacheOfflinePin(pin, credentialVersion = null, expiresAt = null) {
    const salt = crypto.randomBytes(24).toString("base64");
    const verifier = { salt, digest: derive(pin, salt), work_factor: 16384, credential_version: credentialVersion, expires_at: expiresAt, cached_at: nowIso() };
    const envelope = encrypt(verifier);
    if (!envelope.value) {
      logger.warn("station_offline_verifier_not_cached", { reason: "OS_SECURE_STORAGE_UNAVAILABLE" });
      return false;
    }
    local.verifier = envelope;
    state.credentialVersion = credentialVersion || state.credentialVersion;
    state.offlineVerifierAvailable = true;
    writeLocal();
    return true;
  }

  function provisionRecoveryCodes(codes = [], options = {}) {
    const expiresAt = options.expiresAt || null;
    const version = options.credentialVersion || state.credentialVersion || null;
    local.recovery = codes.filter((code) => safeString(code, 128)).slice(0, 20).map((code) => {
      const salt = crypto.randomBytes(24).toString("base64");
      return { id: crypto.randomUUID(), salt, digest: derive(code, salt), work_factor: 16384, credential_version: version, expires_at: expiresAt, used_at: null, created_at: nowIso() };
    });
    state.recoveryCodesAvailable = local.recovery.length;
    writeLocal();
    return publicStatus();
  }

  function verifyOffline(secret, method) {
    if (method === "pin") {
      const verifier = decrypt(local.verifier);
      if (!verifier) return { ok: false, reason: "OFFLINE_VERIFIER_UNAVAILABLE" };
      if (verifier.expires_at && new Date(verifier.expires_at).getTime() <= Date.now()) return { ok: false, reason: "OFFLINE_VERIFIER_EXPIRED" };
      const digest = derive(secret, verifier.salt, verifier.work_factor);
      return timingEqual(digest, verifier.digest) ? { ok: true, method: "offline-pin", credentialVersion: verifier.credential_version } : { ok: false, reason: "INVALID_PIN" };
    }
    const entry = (local.recovery || []).find((candidate) => !candidate.used_at && (!candidate.expires_at || new Date(candidate.expires_at).getTime() > Date.now()) && timingEqual(derive(secret, candidate.salt, candidate.work_factor), candidate.digest));
    if (!entry) return { ok: false, reason: "INVALID_RECOVERY_CODE" };
    entry.used_at = nowIso();
    writeLocal();
    return { ok: true, method: "offline-recovery", recoveryCodeId: entry.id, credentialVersion: entry.credential_version };
  }

  function lockoutActive() {
    if (!state.lockoutUntil) return false;
    if (new Date(state.lockoutUntil).getTime() > Date.now()) return true;
    state.lockoutUntil = null;
    state.failedAttempts = 0;
    writeLocal();
    return false;
  }

  async function submit(payload = {}) {
    const policy = getPolicy();
    if (lockoutActive()) return sendStatus({ ok: false, reason: "LOCKED_OUT", message: "Trop de tentatives. Réessayez après la fin du délai." });
    const method = payload.method === "recovery" ? "recovery" : "pin";
    const secret = safeString(payload.secret, 256);
    const reason = safeString(payload.reason, 1000);
    if (method === "pin" && !/^\d{6,}$/.test(secret) && !/^[A-Za-z0-9!@#$%*._-]{8,}$/.test(secret)) {
      return sendStatus({ ok: false, reason: "PIN_FORMAT_INVALID", message: "Saisissez au moins six chiffres ou un code administrateur valide." });
    }
    if (!secret) return sendStatus({ ok: false, reason: "CREDENTIAL_REQUIRED", message: "Saisissez le code administrateur." });
    if (policy.exit_reason_required && !reason) return sendStatus({ ok: false, reason: "EXIT_REASON_REQUIRED", message: "Le motif de sortie est obligatoire." });

    state.lastAttemptAt = nowIso();
    let result = null;
    let onlineError = null;
    try {
      result = await verifyOnline?.({ method, secret, reason, requestId: activeRequest?.requestId || null });
    } catch (error) {
      onlineError = error;
      logger.warn("station_unlock_online_verification_failed", { message: error.message });
    }

    let offline = false;
    if (!result?.ok && onlineError && policy.offline_unlock_permitted) {
      result = verifyOffline(secret, method);
      offline = Boolean(result.ok);
    }

    if (result?.ok) {
      state.failedAttempts = 0;
      state.lockoutUntil = null;
      state.lastSuccessAt = nowIso();
      if (offline) state.lastOfflineSuccessAt = nowIso();
      if (!offline && method === "pin" && policy.offline_unlock_permitted && result.offline_verifier_eligible !== false) cacheOfflinePin(secret, result.credential_version || result.credentialVersion || null, result.offline_expires_at || null);
      writeLocal();
      await onAttempt?.({ success: true, method: result.method || method, online: !offline, reason, result: clone(result) });
      await onUnlocked?.({ method: result.method || method, online: !offline, reason, result: clone(result) });
      const status = sendStatus({ ok: true, message: offline ? "Déverrouillage hors ligne validé." : "Déverrouillage validé." });
      closeWindow();
      activeRequest?.resolve?.({ ok: true, offline, method: result.method || method, reason, status });
      activeRequest = null;
      return status;
    }

    state.failedAttempts += 1;
    const threshold = Math.max(1, Number(policy.failed_attempt_threshold || 5));
    if (state.failedAttempts >= threshold) {
      const baseSeconds = Math.max(15, Number(policy.lockout_duration_seconds || 300));
      const escalation = Math.min(4, Math.floor(state.failedAttempts / threshold));
      state.lockoutUntil = new Date(Date.now() + baseSeconds * escalation * 1000).toISOString();
    }
    writeLocal();
    await onAttempt?.({ success: false, method, online: !onlineError, reason, failureReason: result?.reason || onlineError?.message || "INVALID_CREDENTIAL", failedAttempts: state.failedAttempts, lockoutUntil: state.lockoutUntil });
    return sendStatus({ ok: false, reason: result?.reason || onlineError?.message || "INVALID_CREDENTIAL", message: state.lockoutUntil ? "Poste temporairement verrouillé après plusieurs tentatives." : "Code administrateur incorrect." });
  }

  function closeWindow() {
    if (!unlockWindow || unlockWindow.isDestroyed()) { unlockWindow = null; return; }
    unlockWindow.destroy();
    unlockWindow = null;
  }

  async function requestUnlock(input = {}) {
    installHandlers();
    if (unlockWindow && !unlockWindow.isDestroyed()) {
      unlockWindow.show();
      unlockWindow.focus();
      return activeRequest?.promise || Promise.resolve(publicStatus());
    }
    const requestId = crypto.randomUUID();
    let resolvePromise;
    let rejectPromise;
    const promise = new Promise((resolve, reject) => { resolvePromise = resolve; rejectPromise = reject; });
    activeRequest = { requestId, resolve: resolvePromise, reject: rejectPromise, promise, source: safeString(input.source || "local", 100) };
    unlockWindow = new BrowserWindow({
      parent: parentWindow || undefined,
      modal: true,
      show: false,
      width: 520,
      height: 650,
      minWidth: 460,
      minHeight: 560,
      resizable: false,
      minimizable: false,
      maximizable: false,
      fullscreenable: false,
      alwaysOnTop: true,
      title: "Déverrouillage administrateur ANGELCARE",
      backgroundColor: "#f8fbff",
      webPreferences: {
        preload: path.join(__dirname, "..", "unlock-preload.cjs"),
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
        webSecurity: true,
        allowRunningInsecureContent: false,
        devTools: false,
      },
    });
    unlockWindow.removeMenu();
    unlockWindow.setMenuBarVisibility(false);
    unlockWindow.setAlwaysOnTop(true, "screen-saver");
    unlockWindow.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
    unlockWindow.webContents.on("will-navigate", (event, url) => { if (url !== localUrl) event.preventDefault(); });
    unlockWindow.webContents.on("did-finish-load", () => {
      unlockWindow.show();
      unlockWindow.focus();
      sendStatus({ requestId, source: activeRequest?.source, policy: { exitReasonRequired: Boolean(getPolicy().exit_reason_required), offlineUnlockPermitted: Boolean(getPolicy().offline_unlock_permitted) } });
    });
    unlockWindow.on("close", (event) => {
      if (getPolicy().mode === "locked" && activeRequest) {
        event.preventDefault();
        unlockWindow.hide();
        onCancelled?.();
        setTimeout(() => { if (unlockWindow && !unlockWindow.isDestroyed()) { unlockWindow.show(); unlockWindow.focus(); } }, 120);
      }
    });
    unlockWindow.on("closed", () => { unlockWindow = null; });
    await unlockWindow.loadURL(localUrl);
    return promise;
  }

  function rotateCredential() {
    local.verifier = null;
    local.recovery = [];
    state.credentialVersion = null;
    state.offlineVerifierAvailable = false;
    state.recoveryCodesAvailable = 0;
    state.failedAttempts = 0;
    state.lockoutUntil = null;
    writeLocal();
    return publicStatus();
  }

  function destroy() {
    closeWindow();
    if (handlersInstalled) {
      ipcMain.removeHandler(UNLOCK_SUBMIT_CHANNEL);
      ipcMain.removeHandler(UNLOCK_CANCEL_CHANNEL);
      handlersInstalled = false;
    }
  }

  return Object.freeze({
    getStatus: publicStatus,
    requestUnlock,
    cacheOfflinePin,
    provisionRecoveryCodes,
    rotateCredential,
    closeWindow,
    destroy,
  });
}

module.exports = { createStationUnlockController, derive, timingEqual };
