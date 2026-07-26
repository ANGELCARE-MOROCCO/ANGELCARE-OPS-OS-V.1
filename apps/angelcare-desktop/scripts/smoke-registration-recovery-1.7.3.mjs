import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { createGovernanceController } = require("../src/runtime/governance.cjs");

const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "angelcare-registration-recovery-"));
const statePath = path.join(temporary, "desktop-governance.json");
fs.writeFileSync(statePath, `${JSON.stringify({
  installationId: "installation-1-7-1-recovery-test",
  deviceId: "deleted-device-id",
  deviceName: "ANGELCARE-RECOVERY-TEST",
  approvalStatus: "approved",
  selectedWorkspaceId: "workspace-admin-tmr",
  selectedWorkspaceName: "ADMIN TMR",
}, null, 2)}\n`);

let registrationCalls = 0;
let authorizationCalls = 0;
const newDevice = {
  id: "new-device-id",
  installation_id: "installation-1-7-1-recovery-test",
  device_name: "ANGELCARE-RECOVERY-TEST",
  approval_status: "pending",
  desktop_version: "1.7.3",
};

function response(status, payload) {
  return {
    ok: status >= 200 && status < 300,
    status,
    async json() { return payload; },
  };
}

const saasSession = {
  async fetch(url, init = {}) {
    const pathname = new URL(url).pathname;
    if (pathname === "/api/whatsapp-desktop/devices/register") {
      registrationCalls += 1;
      if (registrationCalls === 1) {
        return response(401, { ok: false, error: "AUTHENTICATION_REQUIRED" });
      }
      const approved = registrationCalls >= 3;
      return response(approved ? 200 : 201, {
        ok: true,
        data: {
          device: { ...newDevice, approval_status: approved ? "approved" : "pending" },
          workspace_candidates: [{ workspace_id: "workspace-admin-tmr", access_status: approved ? "approved" : "pending" }],
          linked_request_count: 1,
          recovered: registrationCalls > 2,
        },
      });
    }
    if (pathname === "/api/whatsapp-desktop/authorization/issue" || pathname === "/api/whatsapp-desktop/authorization/renew") {
      authorizationCalls += 1;
      if (authorizationCalls === 1) {
        return response(200, {
          ok: true,
          data: {
            authorized: false,
            reason: "DEVICE_NOT_REGISTERED",
            workspace: { id: "workspace-admin-tmr", name: "ADMIN TMR" },
            assignment: { status: "active", workspace_name: "ADMIN TMR" },
            policy: {},
          },
        });
      }
      const expiresAt = new Date(Date.now() + 15 * 60_000).toISOString();
      const graceExpiresAt = new Date(Date.now() + 30 * 60_000).toISOString();
      return response(200, {
        ok: true,
        data: {
          authorized: true,
          reason: "AUTHORIZED",
          device: { ...newDevice, approval_status: "approved" },
          workspace: { id: "workspace-admin-tmr", name: "ADMIN TMR" },
          assignment: { status: "active", workspace_name: "ADMIN TMR" },
          policy: {},
          lease: { id: "lease-1", expires_at: expiresAt, grace_expires_at: graceExpiresAt },
        },
      });
    }
    if (pathname === "/api/whatsapp-desktop/devices/heartbeat") {
      return response(200, {
        ok: true,
        data: {
          device: { ...newDevice, approval_status: registrationCalls >= 3 ? "approved" : "pending" },
          commands: [],
          server_time: new Date().toISOString(),
        },
      });
    }
    if (pathname === "/api/whatsapp-desktop/commands") {
      return response(200, { ok: true, data: [] });
    }
    throw new Error(`Unexpected URL in recovery smoke: ${url}`);
  },
};

const published = [];
const controller = createGovernanceController({
  app: {
    getPath(name) { return name === "userData" ? temporary : path.join(temporary, name); },
    getVersion() { return "1.7.3"; },
    isPackaged: true,
  },
  runtime: {
    appOrigin: "https://opsmanagement.angelcarehub.com",
    releaseChannel: "stable",
    buildId: "recovery-smoke",
    desktopContractVersion: "11.3.0",
  },
  saasSession,
  logger: { info() {}, warn() {}, error() {} },
  publishState(value) { published.push(value); },
  getWhatsappState() { return { visible: false, authProfile: "qr-likely-required", rendererStatus: "dormant", phase: "dormant", online: true }; },
  actions: { hideWhatsapp() {} },
});

try {
  const pending = await controller.start();
  assert.equal(pending.deviceId, "new-device-id");
  assert.equal(pending.approvalStatus, "pending");
  assert.equal(pending.authorizationReason, "DEVICE_PENDING");
  assert.match(pending.message, /attente d.approbation administrative/i);
  assert.equal(controller.canOpen(), false);

  const authorized = await controller.refresh();
  assert.equal(authorized.deviceId, "new-device-id");
  assert.equal(authorized.approvalStatus, "approved");
  assert.equal(authorized.authorizationReason, "AUTHORIZED");
  assert.equal(controller.canOpen(), true);
  assert.ok(registrationCalls >= 3);
  assert.equal(authorizationCalls, 2);
  assert.ok(published.some((entry) => entry.phase === "device-pending"));
  assert.ok(published.some((entry) => entry.phase === "authorized"));
  console.log("MZ12_DEVICE_REGISTRATION_RECOVERY_SMOKE_PASSED");
} finally {
  controller.stop();
  fs.rmSync(temporary, { recursive: true, force: true });
}
