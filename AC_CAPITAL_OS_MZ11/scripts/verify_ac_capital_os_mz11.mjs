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
const aiCommandPage = path.join(opsRoot, "app", "(protected)", "ac-capital-os", "ai-command", "page.tsx");
const api = path.join(opsRoot, "app", "api", "ac-capital-os", "ai-command-center", "route.ts");
const migration = path.join(repoRoot, "supabase", "migrations", "20260727_ac_capital_os_mz11_ai_command_center.sql");
const readme = path.join(repoRoot, "AC_CAPITAL_OS_MZ11", "README.md");
const manifest = path.join(repoRoot, "AC_CAPITAL_OS_MZ11", "MANIFEST.json");

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
];

assert(exists(page), "protected AC CAPITAL OS route missing");
assert(exists(aiCommandPage), "AI command workspace route missing");
assert(exists(api), "AI Command Center API missing");
assert(exists(migration), "MZ11 migration missing");
assert(exists(readme), "README missing");
assert(exists(manifest), "MANIFEST missing");

for (const [name, file] of previousApis) {
  assert(exists(file), `previous API missing: ${name}`);
}

const aiProviderControlRoute = path.join(opsRoot, "app", "(protected)", "ai-provider-control", "page.tsx");
const aiProviderSnapshotApi = path.join(opsRoot, "app", "api", "ai-provider-control", "snapshot", "route.ts");
const aiProviderActionApi = path.join(opsRoot, "app", "api", "ai-provider-control", "action", "route.ts");

if (!exists(aiProviderControlRoute)) {
  console.warn("WARN: /ai-provider-control route not found in this checkout. MZ11 still installs AC CAPITAL OS bridge contract, but live provider workspace should be present for full wiring.");
}
if (!exists(aiProviderSnapshotApi)) {
  console.warn("WARN: /api/ai-provider-control/snapshot route not found. MZ11 still installs seeded bridge contract.");
}
if (!exists(aiProviderActionApi)) {
  console.warn("WARN: /api/ai-provider-control/action route not found. MZ11 still installs seeded bridge contract.");
}

const mz11Tokens = [
  "AI Command Center",
  "Agent Registry",
  "AI Run History",
  "Prompt Control Library",
  "Skills Control Library",
  "Research Adapter",
  "Provider Configuration",
  "Safety Rules",
  "Troubleshooting Center",
  "AI Confidence Policy",
  "AI Audit Log",
  "Cost Usage Monitor",
  "Permission Matrix",
  "Human Approval Queue",
  "No Automatic Submission",
  "No Exposed API Keys",
  "MZ11_AC_CAPITAL_OS_AI_COMMAND_CENTER",
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
  "Source Confidence",
  "Fit Score",
  "Investor Psychology",
  "Best AngelCare Narrative",
  "Monthly Doctrine Injection",
  "Coordinator Handover",
  "Follow-Up Engine",
  "Submission Log",
  "Manual Email Desk",
  "Safety Warnings",
];

for (const token of mz11Tokens) assertIncludes(page, token);
for (const token of previousTokens) assertIncludes(page, token);

assertIncludes(api, "aiCommandProviderBridge");
assertIncludes(api, "aiCommandAgents");
assertIncludes(api, "aiCommandAgentRuns");
assertIncludes(api, "aiCommandPrompts");
assertIncludes(api, "aiCommandSkills");
assertIncludes(api, "aiCommandResearchAdapters");
assertIncludes(api, "aiCommandProviderSettings");
assertIncludes(api, "aiCommandSafetyRules");
assertIncludes(api, "aiCommandTroubleshootingIssues");
assertIncludes(api, "aiCommandConfidencePolicies");
assertIncludes(api, "aiCommandAuditEvents");
assertIncludes(api, "aiCommandCostUsage");
assertIncludes(api, "aiCommandPermissions");
assertIncludes(api, "aiCommandHumanApprovalQueue");
assertIncludes(api, "/ai-provider-control");
assertIncludes(api, "/api/ai-provider-control/snapshot");
assertIncludes(api, "/api/ai-provider-control/action");
assertIncludes(api, "No Exposed API Keys");
assertIncludes(api, "MZ11_AC_CAPITAL_OS_AI_COMMAND_CENTER");

const wrongRoute = path.join(opsRoot, "app", "ac-capital-os", "page.tsx");
if (exists(wrongRoute)) {
  console.warn("WARN: app/ac-capital-os/page.tsx exists. This MZ11 package did not create or use it; protected route remains canonical.");
}

console.log("MZ11_AC_CAPITAL_OS_AI_COMMAND_CENTER_VERIFIED");
console.log(`Detected mode: ${mode}`);
console.log("Protected route: apps/ops-web/app/(protected)/ac-capital-os/page.tsx");
console.log("Workspace route: apps/ops-web/app/(protected)/ac-capital-os/ai-command/page.tsx");
console.log("API route: apps/ops-web/app/api/ac-capital-os/ai-command-center/route.ts");
console.log("Previous APIs preserved: MZ1-MZ10");
console.log("AI Provider Control bridge checked: /ai-provider-control, snapshot API, action API");
console.log("Next: run TypeScript static check from apps/ops-web.");
