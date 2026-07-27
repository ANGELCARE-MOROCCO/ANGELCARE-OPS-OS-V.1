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
const pipelinePage = path.join(opsRoot, "app", "(protected)", "ac-capital-os", "pipeline", "page.tsx");
const api = path.join(opsRoot, "app", "api", "ac-capital-os", "capital-pipeline", "route.ts");
const migration = path.join(repoRoot, "supabase", "migrations", "20260727_ac_capital_os_mz9_capital_pipeline_crm.sql");
const readme = path.join(repoRoot, "AC_CAPITAL_OS_MZ9", "README.md");
const manifest = path.join(repoRoot, "AC_CAPITAL_OS_MZ9", "MANIFEST.json");

const previousApis = [
  ["foundation", path.join(opsRoot, "app", "api", "ac-capital-os", "foundation", "route.ts")],
  ["executive-cockpit", path.join(opsRoot, "app", "api", "ac-capital-os", "executive-cockpit", "route.ts")],
  ["capital-radar", path.join(opsRoot, "app", "api", "ac-capital-os", "capital-radar", "route.ts")],
  ["qualification-engine", path.join(opsRoot, "app", "api", "ac-capital-os", "qualification-engine", "route.ts")],
  ["funder-intelligence", path.join(opsRoot, "app", "api", "ac-capital-os", "funder-intelligence", "route.ts")],
  ["capital-doctrine", path.join(opsRoot, "app", "api", "ac-capital-os", "capital-doctrine", "route.ts")],
  ["case-builder", path.join(opsRoot, "app", "api", "ac-capital-os", "case-builder", "route.ts")],
  ["data-room", path.join(opsRoot, "app", "api", "ac-capital-os", "data-room", "route.ts")],
];

assert(exists(page), "protected AC CAPITAL OS route missing");
assert(exists(pipelinePage), "pipeline workspace route missing");
assert(exists(api), "capital pipeline API missing");
assert(exists(migration), "MZ9 migration missing");
assert(exists(readme), "README missing");
assert(exists(manifest), "MANIFEST missing");
for (const [name, file] of previousApis) {
  assert(exists(file), `previous API missing: ${name}`);
}

const mz9Tokens = [
  "Capital Pipeline CRM",
  "Deal Flow",
  "Follow-Up Engine",
  "Pipeline Board",
  "Submission Log",
  "Communication Log",
  "Due Diligence Requests",
  "Negotiation Tracker",
  "Outcome and Learning",
  "Relationship Temperature",
  "Weighted Pipeline Value",
  "Follow-Up Due",
  "Overdue Follow-Up",
  "Learning Injected",
  "MZ9_AC_CAPITAL_OS_CAPITAL_PIPELINE",
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
  "Source Confidence",
  "Fit Score",
  "Investor Psychology",
  "Best AngelCare Narrative",
  "Monthly Doctrine Injection",
  "Coordinator Handover",
  "Data Room Readiness",
  "Bank Pack",
  "VC Pack",
  "Grant Pack",
];

for (const token of mz9Tokens) assertIncludes(page, token);
for (const token of previousTokens) assertIncludes(page, token);
assertIncludes(api, "capitalPipelineRecords");
assertIncludes(api, "capitalPipelineStages");
assertIncludes(api, "capitalPipelineFollowUps");
assertIncludes(api, "capitalPipelineTasks");
assertIncludes(api, "capitalPipelineCommunications");
assertIncludes(api, "capitalPipelineSubmissions");
assertIncludes(api, "capitalPipelineDueDiligenceRequests");
assertIncludes(api, "capitalPipelineNegotiations");
assertIncludes(api, "capitalPipelineOutcomes");
assertIncludes(api, "capitalPipelineLearningItems");
assertIncludes(api, "capitalPipelineAnalytics");
assertIncludes(api, "capitalPipelineCalendarEvents");
assertIncludes(api, "MZ9_AC_CAPITAL_OS_CAPITAL_PIPELINE");

const wrongRoute = path.join(opsRoot, "app", "ac-capital-os", "page.tsx");
if (exists(wrongRoute)) {
  console.warn("WARN: app/ac-capital-os/page.tsx exists. This MZ9 package did not create or use it; protected route remains canonical.");
}

console.log("MZ9_AC_CAPITAL_OS_CAPITAL_PIPELINE_VERIFIED");
console.log(`Detected mode: ${mode}`);
console.log("Protected route: apps/ops-web/app/(protected)/ac-capital-os/page.tsx");
console.log("Workspace route: apps/ops-web/app/(protected)/ac-capital-os/pipeline/page.tsx");
console.log("API route: apps/ops-web/app/api/ac-capital-os/capital-pipeline/route.ts");
console.log("Previous APIs preserved: MZ1-MZ8");
console.log("Next: run TypeScript static check from apps/ops-web.");
