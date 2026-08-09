import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fail = (message) => {
  console.error(`MZ12_OPS_WEB_VERIFY_FAILED: ${message}`);
  process.exit(1);
};
const read = (relative) => {
  const file = path.join(appRoot, relative);
  if (!fs.existsSync(file)) fail(`Missing ${relative}`);
  return fs.readFileSync(file, "utf8");
};
const markers = (relative, values) => {
  const source = read(relative);
  for (const value of values) {
    if (!source.includes(value)) fail(`${relative} is missing marker: ${value}`);
  }
  return source;
};

const registration = markers("app/api/whatsapp-desktop/devices/register/route.ts", [
  "device_registration_reconciled",
  "workspace_candidates",
  "linked_request_count",
  "desktop_contract_version",
  "registration_reason",
  "previous_device_id",
  "Nouvel appareil enregistré — approbation administrative requise",
  ".is(\"device_id\", null)",
  ".in(\"status\", [\"pending\", \"approved\"])",
]);
if (registration.includes('status: "approved"') && registration.includes("missingAccess")) {
  fail("Newly discovered workspace access must remain pending until administrator approval");
}

markers("lib/desktop/release.ts", [
  'version: "1.7.1"',
  'contract: "11.1.0"',
  'governanceContract: "3.1.0"',
  "buildNumber: 171",
]);
markers("app/api/desktop/runtime/health/route.ts", [
  "ANGELCARE_DESKTOP_RELEASE.version",
  "whatsappRegistrationRecovery: true",
  "whatsappCleanReenrolment: true",
  '"X-AngelCare-Desktop-Version"',
]);
markers("app/api/desktop-stations/admin/overview/route.ts", [
  "compareDesktopVersions",
  "ANGELCARE_DESKTOP_RELEASE.version",
  "old_versions",
  "future_versions",
]);
const corporate = markers("components/whatsapp-os/CorporateStationAdmin.tsx", [
  "ANGELCARE_DESKTOP_RELEASE.version",
  "Postes & Mode Corporate",
]);
if (corporate.includes("Corporate Station OS 1.5.0")) fail("Corporate Station admin still displays stale version 1.5.0");

console.log("MZ12_OPS_WEB_REGISTRATION_RECOVERY_VERIFIED");
console.log("Idempotent device registration, stale identity recovery, pending workspace binding, request linking and synchronized Desktop 1.7.1 release identity are present.");
