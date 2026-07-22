"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const crypto = require("node:crypto");

const COMMAND_ALLOWLIST = new Set([
  "HIDE_WHATSAPP_VIEW",
  "SHOW_ACCESS_REVOKED_NOTICE",
  "RELOAD_WHATSAPP_VIEW",
  "RESTART_WHATSAPP_RENDERER",
  "CLEAR_WHATSAPP_CACHE",
  "CLEAR_WHATSAPP_SESSION",
  "REFRESH_AUTHORIZATION",
  "LOG_OUT_ANGELCARE_DESKTOP",
]);

function nowIso() { return new Date().toISOString(); }
function clone(value) { return JSON.parse(JSON.stringify(value)); }
function safeString(value, max = 500) { return String(value ?? "").trim().slice(0, max); }

function readJson(filePath, fallback = {}) {
  try { return JSON.parse(fs.readFileSync(filePath, "utf8")); } catch { return fallback; }
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const temporary = `${filePath}.tmp`;
  fs.writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
  fs.renameSync(temporary, filePath);
}

function platformName(platform) {
  if (platform === "darwin") return "macos";
  if (platform === "win32") return "windows";
  if (platform === "linux") return "linux";
  return "unknown";
}

function createGovernanceController(options) {
  const {
    app,
    runtime,
    saasSession,
    logger,
    publishState,
    getWhatsappState,
    actions,
  } = options;

  const statePath = path.join(app.getPath("userData"), "desktop-governance.json");
  const persisted = readJson(statePath);
  const installationId = safeString(persisted.installationId, 160) || crypto.randomUUID();
  let heartbeatTimer = null;
  let renewTimer = null;
  let commandTimer = null;
  let started = false;
  let processingCommands = false;
  let authorizationRequest = null;
  let lastAccessHideReason = null;
  // WHATSAPP_LEASE_STABILITY_V1

  let state = {
    available: true,
    contractVersion: "3.0.0",
    phase: "initializing",
    message: "Initialisation du contrôle d’accès WhatsApp Desktop…",
    detail: null,
    installationId,
    deviceId: persisted.deviceId || null,
    deviceName: persisted.deviceName || os.hostname() || "ANGELCARE Desktop",
    approvalStatus: persisted.approvalStatus || "unknown",
    selectedWorkspaceId: persisted.selectedWorkspaceId || null,
    selectedWorkspaceName: persisted.selectedWorkspaceName || null,
    authorized: false,
    authorizationReason: "NOT_CHECKED",
    leaseId: null,
    leaseExpiresAt: null,
    graceExpiresAt: null,
    offlineGraceActive: false,
    policy: null,
    assignment: null,
    workspace: null,
    lastRegisteredAt: null,
    lastHeartbeatAt: null,
    lastAuthorizationAt: null,
    lastCommandAt: null,
    lastErrorAt: null,
    pendingCommands: 0,
    online: null,
    desktopVersion: app.getVersion(),
    platform: platformName(process.platform),
    architecture: process.arch,
    operatingSystemVersion: os.release(),
    timestamp: nowIso(),
  };

  function persist() {
    writeJson(statePath, {
      installationId,
      deviceId: state.deviceId,
      deviceName: state.deviceName,
      approvalStatus: state.approvalStatus,
      selectedWorkspaceId: state.selectedWorkspaceId,
      selectedWorkspaceName: state.selectedWorkspaceName,
      updatedAt: nowIso(),
    });
  }

  function update(patch = {}) {
    state = { ...state, ...patch, timestamp: nowIso() };
    persist();
    publishState(clone(state));
    return clone(state);
  }

  async function api(relativePath, init = {}) {
    const url = new URL(relativePath, `${runtime.appOrigin}/`).href;
    const response = await saasSession.fetch(url, {
      ...init,
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        "X-AngelCare-Desktop": "1",
        "X-AngelCare-Desktop-Version": app.getVersion(),
        "X-AngelCare-Desktop-Installation": installationId,
        ...(init.headers || {}),
      },
    });
    let payload = null;
    try { payload = await response.json(); } catch { payload = { ok: false, error: `HTTP_${response.status}` }; }
    if (!response.ok || !payload?.ok) {
      const error = new Error(payload?.error || `HTTP_${response.status}`);
      error.status = response.status;
      throw error;
    }
    return payload.data;
  }

  function timestampValue(value) {
    const timestamp = value ? new Date(value).getTime() : Number.NaN;
    return Number.isFinite(timestamp) ? timestamp : 0;
  }

  function authorizationStillValid() {
    return Boolean(
      state.authorized
      && timestampValue(state.leaseExpiresAt) > Date.now()
    );
  }

  function graceStillValid() {
    return timestampValue(state.graceExpiresAt) > Date.now();
  }

  function canOpen() {
    return authorizationStillValid()
      || Boolean(
        state.authorized
        && state.offlineGraceActive
        && graceStillValid()
      );
  }

  function hideForAccess(reason) {
    if (lastAccessHideReason === reason) return;
    lastAccessHideReason = reason;
    actions.hideWhatsapp?.(reason);
  }

  function enforceAccess(reason = "authorization_check") {
    if (canOpen()) {
      lastAccessHideReason = null;
      return true;
    }

    hideForAccess(reason);

    const authorizationReason =
      state.authorizationReason || "ACCESS_NOT_AUTHORIZED";

    if (
      state.authorized
      || state.offlineGraceActive
      || state.phase !== "blocked"
      || state.authorizationReason !== authorizationReason
    ) {
      update({
        authorized: false,
        offlineGraceActive: false,
        phase: "blocked",
        message: "Accès WhatsApp Desktop non autorisé.",
        authorizationReason,
      });
    }

    return false;
  }

  async function register() {
    update({ phase: "registering", message: "Enregistrement de l’appareil ANGELCARE Desktop…", detail: null });
    try {
      const data = await api("/api/whatsapp-desktop/devices/register", {
        method: "POST",
        body: JSON.stringify({
          installation_id: installationId,
          device_name: state.deviceName,
          platform: state.platform,
          architecture: state.architecture,
          desktop_version: app.getVersion(),
          operating_system_version: state.operatingSystemVersion,
          runtime_health: { phase: "running", packaged: app.isPackaged },
          metadata: { release_channel: runtime.releaseChannel, build_id: runtime.buildId },
        }),
      });
      update({
        deviceId: data.id,
        approvalStatus: data.approval_status,
        phase: data.approval_status === "approved" ? "registered" : "device-pending",
        message: data.approval_status === "approved" ? "Appareil ANGELCARE Desktop approuvé." : "Appareil enregistré. Approbation administrateur requise.",
        lastRegisteredAt: nowIso(),
        online: true,
      });
      return clone(state);
    } catch (error) {
      const status = Number(error.status || 0);
      update({
        phase: status === 401 ? "authentication-required" : "registration-error",
        message: status === 401 ? "Connectez-vous à ANGELCARE pour enregistrer cet appareil." : "Impossible d’enregistrer l’appareil.",
        detail: safeString(error.message, 1000),
        lastErrorAt: nowIso(),
        online: status === 401 ? true : false,
      });
      return clone(state);
    }
  }

  async function requestAuthorization({ renew = false } = {}) {
    if (authorizationRequest) return authorizationRequest;

    authorizationRequest = (async () => {
      if (!state.selectedWorkspaceId) {
        return update({
          authorized: false,
          phase: "workspace-required",
          message: "Sélectionnez un espace WhatsApp autorisé.",
          authorizationReason: "WORKSPACE_REQUIRED",
        });
      }

      if (!state.deviceId) await register();

      const hadAuthorizedState = state.authorized;
      const endpoint = renew
        ? "/api/whatsapp-desktop/authorization/renew"
        : "/api/whatsapp-desktop/authorization/issue";

      try {
        const result = await api(endpoint, {
          method: "POST",
          body: JSON.stringify({
            installation_id: installationId,
            workspace_id: state.selectedWorkspaceId,
            desktop_version: app.getVersion(),
          }),
        });

        if (!result.authorized) {
          lastAccessHideReason = null;
          hideForAccess("authorization-denied");

          logger.warn("whatsapp_governance_authorization_denied", {
            renew,
            reason: result.reason || "ACCESS_NOT_AUTHORIZED",
          });

          return update({
            authorized: false,
            approvalStatus:
              result.device?.approval_status || state.approvalStatus,
            authorizationReason:
              result.reason || "ACCESS_NOT_AUTHORIZED",
            phase: "blocked",
            message: authorizationMessage(
              result.reason || "ACCESS_NOT_AUTHORIZED",
            ),
            leaseId: null,
            leaseExpiresAt: null,
            graceExpiresAt: null,
            offlineGraceActive: false,
            policy: result.policy || null,
            assignment: result.assignment || null,
            workspace: result.workspace || null,
            online: true,
            lastAuthorizationAt: nowIso(),
          });
        }

        const leaseExpiresAt = result.lease?.expires_at || null;
        const graceExpiresAt = result.lease?.grace_expires_at || null;

        if (!timestampValue(leaseExpiresAt)) {
          const leaseError = new Error("AUTHORIZATION_LEASE_INVALID");
          leaseError.status = 502;
          throw leaseError;
        }

        lastAccessHideReason = null;

        logger.info("whatsapp_governance_authorization_granted", {
          renew,
          leaseExpiresAt,
          graceExpiresAt,
        });

        return update({
          authorized: true,
          authorizationReason: "AUTHORIZED",
          approvalStatus:
            result.device?.approval_status || "approved",
          phase: "authorized",
          message: "Accès WhatsApp Desktop autorisé.",
          detail: null,
          leaseId: result.lease?.id || null,
          leaseExpiresAt,
          graceExpiresAt,
          offlineGraceActive: false,
          policy: result.policy || null,
          assignment: result.assignment || null,
          workspace: result.workspace || null,
          selectedWorkspaceName:
            result.workspace?.name || state.selectedWorkspaceName,
          online: true,
          lastAuthorizationAt: nowIso(),
        });
      } catch (error) {
        const status = Number(error.status || 0);
        const detail = safeString(error.message, 1000);
        const explicitDenial = [401, 403, 409, 410].includes(status);

        if (!explicitDenial && authorizationStillValid()) {
          logger.warn("whatsapp_governance_renewal_deferred", {
            renew,
            status,
            leaseExpiresAt: state.leaseExpiresAt,
            message: detail,
          });

          return update({
            authorized: true,
            offlineGraceActive: false,
            phase: "authorized",
            message: "Accès WhatsApp Desktop autorisé.",
            detail:
              "Renouvellement temporairement indisponible. "
              + "Le bail actif reste valide.",
            online: false,
            lastErrorAt: nowIso(),
          });
        }

        if (
          !explicitDenial
          && hadAuthorizedState
          && graceStillValid()
        ) {
          logger.warn("whatsapp_governance_offline_grace_started", {
            renew,
            status,
            graceExpiresAt: state.graceExpiresAt,
            message: detail,
          });

          return update({
            authorized: true,
            offlineGraceActive: true,
            phase: "offline-grace",
            message:
              "Connexion interrompue. Accès temporaire selon "
              + "la période de grâce.",
            detail,
            online: false,
            lastErrorAt: nowIso(),
          });
        }

        const hideReason = explicitDenial
          ? "authorization-denied"
          : "authorization-network-failure";

        hideForAccess(hideReason);

        logger.warn("whatsapp_governance_authorization_closed", {
          renew,
          status,
          reason: hideReason,
          message: detail,
        });

        return update({
          authorized: false,
          offlineGraceActive: false,
          phase:
            status === 401
              ? "authentication-required"
              : explicitDenial
                ? "blocked"
                : "authorization-error",
          message:
            status === 401
              ? "Reconnectez-vous à ANGELCARE."
              : explicitDenial
                ? "Accès WhatsApp Desktop refusé."
                : "Autorisation ANGELCARE indisponible.",
          authorizationReason:
            explicitDenial
              ? safeString(error.message, 160)
              : "AUTHORIZATION_UNAVAILABLE",
          detail,
          online: explicitDenial ? true : false,
          lastErrorAt: nowIso(),
        });
      }
    })();

    try {
      return await authorizationRequest;
    } finally {
      authorizationRequest = null;
    }
  }

  function authorizationMessage(reason) {
    const labels = {
      WORKSPACE_NOT_ACTIVE: "Cet espace WhatsApp est suspendu ou indisponible.",
      ASSIGNMENT_NOT_ACTIVE: "Vous n’êtes pas affecté à cet espace WhatsApp.",
      DEVICE_NOT_REGISTERED: "Cet appareil doit être enregistré.",
      DEVICE_PENDING: "Cet appareil attend l’approbation d’un administrateur.",
      DEVICE_SUSPENDED: "Cet appareil est suspendu.",
      DEVICE_REVOKED: "Cet appareil est révoqué.",
      DEVICE_COMPROMISED: "Cet appareil est bloqué pour raison de sécurité.",
      DEVICE_WORKSPACE_NOT_APPROVED: "Cet appareil n’est pas approuvé pour cet espace WhatsApp.",
      DESKTOP_UPDATE_REQUIRED: "Une mise à jour ANGELCARE Desktop est obligatoire.",
      DESKTOP_VERSION_BLOCKED: "Cette version ANGELCARE Desktop est bloquée.",
    };
    return labels[reason] || `Accès WhatsApp Desktop refusé : ${reason}`;
  }

  async function selectWorkspace(input = {}) {
    const workspaceId = safeString(input.workspaceId, 100);
    if (!workspaceId) throw new Error("A valid workspaceId is required.");
    update({ selectedWorkspaceId: workspaceId, selectedWorkspaceName: safeString(input.workspaceName, 180) || null, authorized: false, phase: "authorizing", message: "Vérification de l’autorisation de l’espace WhatsApp…" });
    return requestAuthorization({ renew: false });
  }

  async function heartbeat() {
    if (!state.deviceId) await register();
    if (!state.deviceId) return clone(state);
    const whatsapp = getWhatsappState();
    try {
      const result = await api("/api/whatsapp-desktop/devices/heartbeat", {
        method: "POST",
        body: JSON.stringify({
          installation_id: installationId,
          workspace_id: state.selectedWorkspaceId,
          desktop_version: app.getVersion(),
          whatsapp_visible: Boolean(whatsapp?.visible),
          whatsapp_link_state: whatsapp?.authProfile === "local-profile-present" ? "linked" : whatsapp?.authProfile === "qr-likely-required" ? "qr_required" : "unknown",
          authorization_state: state.authorized ? (state.offlineGraceActive ? "grace" : "authorized") : "blocked",
          runtime_health: { renderer_status: whatsapp?.rendererStatus || "unknown", whatsapp_phase: whatsapp?.phase || "unknown", online: whatsapp?.online },
        }),
      });
      update({ lastHeartbeatAt: nowIso(), online: true, approvalStatus: result.device?.approval_status || state.approvalStatus, pendingCommands: result.commands?.length || 0 });
      await executeCommands(result.commands || []);
    } catch (error) {
      logger.warn("whatsapp_governance_heartbeat_failed", { message: error.message });
      if (!authorizationStillValid() && !graceStillValid()) enforceAccess("heartbeat-expired");
      else update({ online: false, lastErrorAt: nowIso(), detail: safeString(error.message, 1000) });
    }
    return clone(state);
  }

  async function acknowledge(commandId, stateName, detail = "", evidence = {}) {
    try {
      await api(`/api/whatsapp-desktop/commands/${encodeURIComponent(commandId)}/acknowledge`, {
        method: "POST",
        body: JSON.stringify({ installation_id: installationId, state: stateName, detail, evidence }),
      });
    } catch (error) {
      logger.warn("whatsapp_governance_command_ack_failed", { commandId, state: stateName, message: error.message });
    }
  }

  async function executeCommands(commands) {
    if (processingCommands || !Array.isArray(commands) || !commands.length) return;
    processingCommands = true;
    try {
      for (const command of commands) {
        if (!COMMAND_ALLOWLIST.has(command.command_type)) {
          await acknowledge(command.id, "failed", "Unsupported command type.");
          continue;
        }
        await acknowledge(command.id, "received", "Command received by ANGELCARE Desktop.");
        await acknowledge(command.id, "executing", "Command execution started.");
        try {
          switch (command.command_type) {
            case "HIDE_WHATSAPP_VIEW": actions.hideWhatsapp?.("remote-command"); break;
            case "SHOW_ACCESS_REVOKED_NOTICE": actions.hideWhatsapp?.("access-revoked"); update({ authorized: false, phase: "revoked", message: command.reason || "Accès révoqué." }); break;
            case "RELOAD_WHATSAPP_VIEW": await actions.reloadWhatsapp?.(); break;
            case "RESTART_WHATSAPP_RENDERER": await actions.restartWhatsapp?.(); break;
            case "CLEAR_WHATSAPP_CACHE": await actions.clearWhatsappCache?.(); break;
            case "CLEAR_WHATSAPP_SESSION": await actions.clearWhatsappSession?.({ remote: true }); break;
            case "REFRESH_AUTHORIZATION": await requestAuthorization({ renew: true }); break;
            case "LOG_OUT_ANGELCARE_DESKTOP": actions.hideWhatsapp?.("remote-logout"); await actions.logoutDesktop?.(); break;
          }
          update({ lastCommandAt: nowIso() });
          await acknowledge(command.id, "completed", "Command completed.", { completedAt: nowIso() });
        } catch (error) {
          await acknowledge(command.id, "failed", safeString(error.message, 1000));
        }
      }
    } finally {
      processingCommands = false;
    }
  }

  async function pollCommands() {
    if (!state.deviceId) return;
    try {
      const commands = await api(`/api/whatsapp-desktop/commands?installationId=${encodeURIComponent(installationId)}`);
      update({ pendingCommands: commands.length || 0, online: true });
      await executeCommands(commands);
    } catch (error) {
      logger.warn("whatsapp_governance_command_poll_failed", { message: error.message });
    }
  }

  function schedule() {
    clearInterval(heartbeatTimer);
    clearInterval(renewTimer);
    clearInterval(commandTimer);

    heartbeatTimer = setInterval(
      () => void heartbeat(),
      Math.max(
        15,
        Number(state.policy?.heartbeat_active_seconds || 45),
      ) * 1000,
    );

    renewTimer = setInterval(() => {
      if (!state.selectedWorkspaceId) return;

      void (async () => {
        await requestAuthorization({ renew: true });

        if (
          !canOpen()
          && ![
            "blocked",
            "authorization-error",
            "authentication-required",
            "workspace-required",
          ].includes(state.phase)
        ) {
          enforceAccess("lease-expired");
        }
      })().catch((error) => {
        logger.warn("whatsapp_governance_renewal_cycle_failed", {
          message: error.message,
        });
      });
    }, 60_000);

    commandTimer = setInterval(
      () => void pollCommands(),
      30_000,
    );
  }

  async function start() {
    if (started) {
      await register();
      if (state.selectedWorkspaceId) await requestAuthorization({ renew: false });
      return clone(state);
    }
    started = true;
    await register();
    if (state.selectedWorkspaceId) await requestAuthorization({ renew: false });
    schedule();
    await heartbeat();
    return clone(state);
  }

  function stop() {
    started = false;
    clearInterval(heartbeatTimer);
    clearInterval(renewTimer);
    clearInterval(commandTimer);
    heartbeatTimer = null;
    renewTimer = null;
    commandTimer = null;
  }

  return Object.freeze({
    getState: () => clone(state),
    getInstallationId: () => installationId,
    canOpen,
    enforceAccess,
    start,
    stop,
    register,
    heartbeat,
    refresh: () => requestAuthorization({ renew: true }),
    selectWorkspace,
  });
}

module.exports = { createGovernanceController };
