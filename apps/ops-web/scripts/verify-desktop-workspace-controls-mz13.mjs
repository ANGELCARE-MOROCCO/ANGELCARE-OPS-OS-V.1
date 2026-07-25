import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fail = (message) => { console.error(`MZ13_OPS_WEB_VERIFY_FAILED: ${message}`); process.exit(1); };
const read = (relative) => {
  const file = path.join(root, relative);
  if (!fs.existsSync(file)) fail(`Missing ${relative}`);
  return fs.readFileSync(file, "utf8");
};
const requireMarkers = (relative, markers) => {
  const source = read(relative);
  for (const marker of markers) if (!source.includes(marker)) fail(`${relative} missing marker: ${marker}`);
};

requireMarkers("lib/desktop/release.ts", [
  'version: "1.7.2"',
  'contract: "11.2.0"',
  "buildNumber: 172",
]);
requireMarkers("lib/desktop-stations/server.ts", [
  "maximum_ac_plus_tabs: 6",
  "ac_plus_enabled: true",
  'ac_plus_allowed_modes: ["standard", "focus"]',
  "split_enabled: true",
  'split_allowed_modes: ["standard", "focus"]',
  "split_modes: [2, 3, 4]",
  "const maximumTabs = numberBetween",
]);
requireMarkers("app/api/desktop/runtime/health/route.ts", [
  "runtimeModeAwareWorkspaceControls: true",
  "splitRecompositionWhileActive: true",
  "acPlusWorkspaces: true",
]);
console.log("MZ13_OPS_WEB_WORKSPACE_CAPABILITY_CONTRACT_VERIFIED");
