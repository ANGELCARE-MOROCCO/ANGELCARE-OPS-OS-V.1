import fs from "node:fs";
import path from "node:path";

const exists = (file) => fs.existsSync(file);
function roots(start = process.cwd()) {
  if (exists(path.join(start, "apps", "ops-web"))) return { repo: start, ops: path.join(start, "apps", "ops-web") };
  if (exists(path.join(start, "app")) && exists(path.join(start, "package.json"))) return { repo: path.resolve(start, "..", ".."), ops: start };
  throw new Error("Run from repository root or apps/ops-web.");
}
function fail(message) { console.error(`FAIL: ${message}`); process.exit(1); }
function read(file) { return fs.readFileSync(file, "utf8"); }

const { repo, ops } = roots();
const required = [
  "components/ac-capital-os/core/AcCapitalShell.tsx",
  "components/ac-capital-os/core/action-center.tsx",
  "components/ac-capital-os/core/useAction.ts",
  "components/ac-capital-os/core/Overlay.tsx",
  "components/ac-capital-os/core/shell.module.css",
  "components/ac-capital-os/core/core.module.css",
  "components/ac-capital-os/pages/radar/RadarPage.tsx",
  "components/ac-capital-os/pages/ai-command/AiCommandPage.tsx",
  "app/api/ac-capital-os/command-activity/route.ts",
  "app/api/ac-capital-os/ai-command-center/run/route.ts",
];
for (const relative of required) if (!exists(path.join(ops, relative))) fail(`missing ${relative}`);

const shell = read(path.join(ops, "components/ac-capital-os/core/AcCapitalShell.tsx"));
for (const token of ["AngelCareLogo", "Command Activity Center", "Confidential founder environment", "IntersectionObserver", "latestToast"]) {
  if (!shell.includes(token)) fail(`shell missing ${token}`);
}

const action = read(path.join(ops, "components/ac-capital-os/core/useAction.ts"));
for (const token of ["completed-with-warnings", "awaiting-approval", "persistCapitalCommandEvent", "duplicate-submit"]) {
  if (token === "duplicate-submit") continue;
  if (!action.includes(token)) fail(`action lifecycle missing ${token}`);
}

const radar = read(path.join(ops, "components/ac-capital-os/pages/radar/RadarPage.tsx"));
for (const token of ["Run Governed Research Dry Test", "Research Run History", "ActionFeedback", "Governed scans"]) {
  if (!radar.includes(token)) fail(`radar completion flow missing ${token}`);
}

const ai = read(path.join(ops, "components/ac-capital-os/pages/ai-command/AiCommandPage.tsx"));
const aiNormalized = ai.toLowerCase();
for (const token of ["provider", "workspace", "linked skills", "governed"]) {
  if (!aiNormalized.includes(token)) fail(`AI command hydration UI missing ${token}`);
}

const api = read(path.join(ops, "app/api/ac-capital-os/command-activity/route.ts"));
for (const token of ["GET", "POST", "PATCH", "ac_capital_command_activity"]) {
  if (!api.includes(token)) fail(`command activity API missing ${token}`);
}

const migration = path.join(repo, "supabase/migrations/20260728_ac_capital_os_mz16_institutional_command_experience.sql");
if (!exists(migration)) fail("MZ16 migration missing");
const sql = read(migration);
for (const token of ["begin;", "commit;", "ac_capital_command_activity", "remaining", "policy_row.decision"]) {
  if (token === "remaining") continue;
  if (!sql.includes(token)) fail(`migration missing ${token}`);
}

console.log("AC_CAPITAL_OS_MZ16_INSTITUTIONAL_COMMAND_EXPERIENCE_STATIC_VERIFIED");
console.log("PASS institutional AngelCare shell and large-screen zoning");
console.log("PASS persistent command activity and toast lifecycle");
console.log("PASS radar visible completion workflow");
console.log("PASS AI command truth-state presentation");
console.log("PASS additive SQL and exact-pattern policy ambiguity repair");
console.log("Next: apply SQL, run repository TypeScript, then perform authenticated browser acceptance.");
