import fs from "node:fs";
import path from "node:path";

const cwd = process.cwd();

function exists(p) {
  return fs.existsSync(p);
}

function read(p) {
  return fs.readFileSync(p, "utf8");
}

function findRoots(start) {
  const opsFromRepo = path.join(start, "apps", "ops-web");
  if (exists(opsFromRepo)) {
    return { mode: "repository-root", repoRoot: start, opsRoot: opsFromRepo };
  }
  if (exists(path.join(start, "app")) && exists(path.join(start, "package.json"))) {
    return { mode: "ops-web-root", repoRoot: path.resolve(start, "..", ".."), opsRoot: start };
  }
  throw new Error("Unable to detect repository root or apps/ops-web root.");
}

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exit(1);
  }
}

function assertIncludes(filePath, token) {
  const content = read(filePath);
  assert(content.includes(token), `${path.relative(process.cwd(), filePath)} missing token: ${token}`);
}

const { mode, repoRoot, opsRoot } = findRoots(cwd);

const page = path.join(opsRoot, "app", "(protected)", "ac-capital-os", "page.tsx");
const strategyPage = path.join(opsRoot, "app", "(protected)", "ac-capital-os", "strategy", "page.tsx");
const api = path.join(opsRoot, "app", "api", "ac-capital-os", "strategy-production-command", "route.ts");
const migration = path.join(repoRoot, "supabase", "migrations", "20260727_ac_capital_os_mz12_strategy_production_command.sql");
const readme = path.join(repoRoot, "AC_CAPITAL_OS_MZ12", "README.md");
const manifest = path.join(repoRoot, "AC_CAPITAL_OS_MZ12", "MANIFEST.json");

const previousApis = [
  ["foundation", path.join(opsRoot, "app", "api", "ac-capital-os", "foundation", "route.ts")],
  ["executive-cockpit", path.join(opsRoot, "app", "api", "ac-capital-os", "executive-cockpit", "route.ts")],
  ["capital-radar", path.join(opsRoot, "app", "api", "ac-capital-os", "capital-radar", "route.ts")],
  ["qualification-engine", path.join(opsRoot, "app", "api", "ac-capital-os", "qualification-engine", "route.ts")],
  ["funder-intelligence", path.join(opsRoot, "app", "api", "ac-capital-os", "funder-intelligence", "route.ts")],
  ["capital-doctrine", path.join(opsRoot, "app", "api", "ac-capital-os", "capital-doctrine", "route.ts")],
  ["case-builder", path.join(opsRoot, "app", "api", "ac-capital-os", "case-builder", "route.ts")],
  ["data-room", path.join(opsRoot, "app", "api", "ac-capital-os", "data-room", "route.ts")],
  ["capital-pipeline", path.join(opsRoot, "app", "api", "ac-capital-os", "capital-pipeline", "route.ts")],
  ["coordinator-cockpit", path.join(opsRoot, "app", "api", "ac-capital-os", "coordinator-cockpit", "route.ts")],
  ["ai-command-center", path.join(opsRoot, "app", "api", "ac-capital-os", "ai-command-center", "route.ts")],
];

assert(exists(page), "protected AC CAPITAL OS route missing");
assert(exists(strategyPage), "MZ12 strategy workspace route missing");
assert(exists(api), "MZ12 strategy-production-command API missing");
assert(exists(migration), "MZ12 migration missing");
assert(exists(readme), "README missing");
assert(exists(manifest), "MANIFEST missing");

for (const [name, file] of previousApis) assert(exists(file), `previous API missing: ${name}`);

const mz12Tokens = [
  "Strategy Simulator & Production Command",
  "Capital Scenarios",
  "Executive Reports",
  "SOP Manual",
  "Production Readiness",
  "Seeded-to-Live Wiring Map",
  "Launch Control Checklist",
  "Financial Sensitivity",
  "Risk Stress Test",
  "Bank-first Strategy",
  "Grant Impact Strategy",
  "VC Angel Strategy",
  "Blended Finance Strategy",
  "Database Foundation Activated",
  "Tables Created",
  "Seeded Only",
  "Needs Wiring",
  "No Automatic Submission",
  "MZ12_AC_CAPITAL_OS_STRATEGY_PRODUCTION_COMMAND",
];

const previousTokens = [
  "AC CAPITAL OS",
  "Capital Executive Cockpit",
  "Capital Radar",
  "Qualification Engine",
  "Funder Intelligence Room",
  "Capital Doctrine Vault",
  "Fundraising Case Builder",
  "Due Diligence Data Room",
  "Capital Pipeline CRM",
  "Human Coordinator Cockpit",
  "AI Command Center",
  "No Exposed API Keys",
  "Safety Warnings",
  "Manual Email Desk",
  "Submission Log",
];

for (const token of mz12Tokens) assertIncludes(page, token);
for (const token of previousTokens) assertIncludes(page, token);

for (const token of [
  "strategyScenarios",
  "strategyScenarioComparisons",
  "financialSensitivityModels",
  "riskStressTests",
  "executiveReports",
  "sopManuals",
  "sopWorkflowSteps",
  "productionReadinessChecks",
  "seededToLiveWiringMap",
  "launchControlChecklist",
  "databaseActivationStatus",
  "aiProviderBridgeStatus",
  "productionBlockers",
  "strategyAuditEvents",
  "dataMode: \"seeded-contract\"",
  "databaseFoundation: \"tables-created\"",
  "livePersistence: \"pending\"",
  "automaticSubmission: false",
  "MZ12_AC_CAPITAL_OS_STRATEGY_PRODUCTION_COMMAND",
]) assertIncludes(api, token);

const wrongRoute = path.join(opsRoot, "app", "ac-capital-os", "page.tsx");
if (exists(wrongRoute)) {
  console.warn("WARN: app/ac-capital-os/page.tsx exists. This MZ12 package did not create or use it; protected route remains canonical.");
}

console.log("MZ12_AC_CAPITAL_OS_STRATEGY_PRODUCTION_COMMAND_VERIFIED");
console.log(`Detected mode: ${mode}`);
console.log("Protected route: apps/ops-web/app/(protected)/ac-capital-os/page.tsx");
console.log("Workspace route: apps/ops-web/app/(protected)/ac-capital-os/strategy/page.tsx");
console.log("API route: apps/ops-web/app/api/ac-capital-os/strategy-production-command/route.ts");
console.log("Previous APIs preserved: MZ1-MZ11");
console.log("MZ12 SQL copied but not executed automatically.");
console.log("Next: run TypeScript static check from apps/ops-web.");
