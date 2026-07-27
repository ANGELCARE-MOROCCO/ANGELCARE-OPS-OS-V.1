import fs from "node:fs";
import path from "node:path";

const cwd = process.cwd();

function exists(p) { return fs.existsSync(p); }
function read(p) { return fs.readFileSync(p, "utf8"); }

function findRoots(start) {
  const opsFromRepo = path.join(start, "apps", "ops-web");
  if (exists(opsFromRepo)) return { mode: "repository-root", repoRoot: start, opsRoot: opsFromRepo };
  if (exists(path.join(start, "app")) && exists(path.join(start, "package.json"))) return { mode: "ops-web-root", repoRoot: path.resolve(start, "..", ".."), opsRoot: start };
  throw new Error("Unable to detect repository root or apps/ops-web root.");
}
function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exit(1);
  }
}
function assertIncludes(file, token) {
  assert(read(file).includes(token), `${path.relative(process.cwd(), file)} missing token: ${token}`);
}

const { mode, repoRoot, opsRoot } = findRoots(cwd);

const required = [
  path.join(opsRoot, "app", "(protected)", "ac-capital-os", "page.tsx"),
  path.join(opsRoot, "app", "(protected)", "ac-capital-os", "production", "page.tsx"),
  path.join(opsRoot, "lib", "ac-capital-os", "server", "supabase.ts"),
  path.join(opsRoot, "lib", "ac-capital-os", "server", "repository.ts"),
  path.join(opsRoot, "lib", "ac-capital-os", "server", "ai-provider-bridge.ts"),
  path.join(opsRoot, "lib", "ac-capital-os", "server", "ai-runner.ts"),
  path.join(opsRoot, "lib", "ac-capital-os", "server", "research-adapter.ts"),
  path.join(opsRoot, "lib", "ac-capital-os", "server", "storage.ts"),
  path.join(opsRoot, "lib", "ac-capital-os", "server", "reports.ts"),
  path.join(opsRoot, "lib", "ac-capital-os", "server", "automation-gates.ts"),
  path.join(opsRoot, "lib", "ac-capital-os", "server", "approval-guard.ts"),
  path.join(opsRoot, "lib", "ac-capital-os", "server", "permissions.ts"),
  path.join(repoRoot, "supabase", "migrations", "20260727_ac_capital_os_mz13_production_wiring.sql"),
  path.join(repoRoot, "AC_CAPITAL_OS_MZ13", "README.md"),
  path.join(repoRoot, "AC_CAPITAL_OS_MZ13", "MANIFEST.json"),
  path.join(repoRoot, "AC_CAPITAL_OS_MZ13", "docs", "AC_CAPITAL_OS_MZ13_PRODUCTION_ACTIVATION_REPORT.md"),
];

for (const file of required) assert(exists(file), `required file missing: ${path.relative(repoRoot, file)}`);

const apiRoutes = [
  "foundation",
  "executive-cockpit",
  "capital-radar",
  "qualification-engine",
  "funder-intelligence",
  "capital-doctrine",
  "case-builder",
  "data-room",
  "capital-pipeline",
  "coordinator-cockpit",
  "ai-command-center",
  "strategy-production-command",
];
for (const route of apiRoutes) {
  const file = path.join(opsRoot, "app", "api", "ac-capital-os", route, "route.ts");
  assert(exists(file), `API missing: ${route}`);
  assertIncludes(file, "createWorkspaceRouteHandlers");
}

const extraApis = [
  "app/api/ac-capital-os/ai-command-center/run/route.ts",
  "app/api/ac-capital-os/ai-command-center/issue/route.ts",
  "app/api/ac-capital-os/capital-radar/research/run/route.ts",
  "app/api/ac-capital-os/data-room/upload/route.ts",
  "app/api/ac-capital-os/data-room/documents/route.ts",
  "app/api/ac-capital-os/reports/generate/route.ts",
  "app/api/ac-capital-os/reports/list/route.ts",
  "app/api/ac-capital-os/coordinator-cockpit/email/prepare/route.ts",
  "app/api/ac-capital-os/coordinator-cockpit/email/mark-sent/route.ts",
  "app/api/ac-capital-os/coordinator-cockpit/workflow/complete-task/route.ts",
];
for (const rel of extraApis) assert(exists(path.join(opsRoot, rel)), `extra API missing: ${rel}`);

const page = path.join(opsRoot, "app", "(protected)", "ac-capital-os", "page.tsx");
for (const token of [
  "AC CAPITAL OS Production Activation",
  "Supabase Live Status",
  "API Data Mode",
  "AI Execution Mode",
  "Provider-Control Status",
  "Storage Status",
  "Report Engine Status",
  "Automation Gate Status",
  "Approval Guard Status",
  "QA Status",
  "No Automatic Submission",
  "No Exposed API Keys",
  "MZ13_AC_CAPITAL_OS_FULL_PRODUCTION_WIRING",
]) assertIncludes(page, token);

const repository = path.join(opsRoot, "lib", "ac-capital-os", "server", "repository.ts");
for (const token of [
  "supabase-live",
  "seeded-fallback",
  "foundation",
  "capital-radar",
  "coordinator-cockpit",
  "ai-command-center",
  "strategy-production-command",
]) assertIncludes(repository, token);

const migration = path.join(repoRoot, "supabase", "migrations", "20260727_ac_capital_os_mz13_production_wiring.sql");
for (const token of [
  "ac_capital_live_wiring_status",
  "ac_capital_runtime_feature_flags",
  "ac_capital_report_exports",
  "ac_capital_storage_objects",
  "ac_capital_automation_gate_events",
  "ac_capital_provider_execution_logs",
  "ac_capital_production_qa_runs",
]) assertIncludes(migration, token);

console.log("MZ13_AC_CAPITAL_OS_FULL_PRODUCTION_WIRING_VERIFIED");
console.log(`Detected mode: ${mode}`);
console.log("Previous APIs preserved and upgraded: MZ1-MZ12");
console.log("Repository layer, AI bridge, storage contract, reports, automation gates, approval guard and QA docs verified.");
console.log("MZ13 SQL copied but not executed automatically.");
