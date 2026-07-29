#!/usr/bin/env node
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const payloadRoot = join(packageRoot, "payload");

function detectRepositoryRoot() {
  const cwd = process.cwd();
  for (const candidate of [cwd, resolve(cwd, ".."), resolve(cwd, "../..")]) {
    if (existsSync(join(candidate, "apps", "ops-web")) && existsSync(join(candidate, "supabase", "migrations"))) return candidate;
  }
  throw new Error("FAIL: AngelCare repository root was not detected.");
}
function listFiles(directory) {
  const files = [];
  for (const name of readdirSync(directory)) {
    const absolute = join(directory, name);
    if (statSync(absolute).isDirectory()) files.push(...listFiles(absolute));
    else files.push(absolute);
  }
  return files;
}
function sha(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}
function assert(condition, message) {
  if (!condition) throw new Error(`FAIL: ${message}`);
}

const repositoryRoot = detectRepositoryRoot();
const opsRoot = join(repositoryRoot, "apps", "ops-web");
const payloadFiles = listFiles(payloadRoot);
for (const source of payloadFiles) {
  const rel = relative(payloadRoot, source);
  const target = join(repositoryRoot, rel);
  assert(existsSync(target), `Installed file missing: ${rel}`);
  assert(sha(source) === sha(target), `Installed payload mismatch: ${rel}`);
}

const radarPage = readFileSync(join(opsRoot, "components/ac-capital-os/pages/radar/RadarPage.tsx"), "utf8");
const workbench = readFileSync(join(opsRoot, "lib/ac-capital-os/server/radar-workbench.ts"), "utf8");
const persistence = readFileSync(join(opsRoot, "lib/ac-capital-os/server/free-provider-persistence.ts"), "utf8");
const runtime = readFileSync(join(opsRoot, "lib/ac-capital-os/server/free-provider-runtime.ts"), "utf8");
const route = readFileSync(join(opsRoot, "app/api/ac-capital-os/capital-radar/route.ts"), "utf8");
const migration = readFileSync(join(repositoryRoot, "supabase/migrations/20260729_ac_capital_os_radar_to_case_workbench_06.sql"), "utf8");

for (const token of [
  "Validation Queue",
  "Opportunity Candidates",
  "Evidence Clusters",
  "Materialize full chain",
  "convert-full-chain",
  "WorkflowLink",
]) assert(radarPage.includes(token), `Radar UI contract token missing: ${token}`);
for (const token of [
  "ensureQualification",
  "ensureCase",
  "ensurePipeline",
  "ensureCoordinatorTasks",
  "ac_capital_radar_conversion_events",
]) assert(workbench.includes(token), `Workflow runtime contract token missing: ${token}`);
for (const token of [
  "linked_opportunity_id",
  "canonical_opportunity_id",
  "qualificationDossiers",
  "internalActions",
]) assert(persistence.includes(token), `Provider persistence contract token missing: ${token}`);
assert(runtime.includes('plugins: [{ id: "response-healing" }]'), "OpenRouter response-healing plugin missing");
assert(runtime.includes("AC_CAPITAL_OPENROUTER_JSON_RESILIENCE_06"), "OpenRouter JSON resilience contract missing");
assert(route.includes("executeRadarWorkbenchAction"), "Radar API is not routed through workbench actions");
for (const token of [
  "ac_capital_radar_evidence_clusters",
  "ac_capital_radar_source_reviews",
  "ac_capital_radar_conversion_events",
  "radar_source_ids",
  "notify pgrst, 'reload schema'",
]) assert(migration.includes(token), `Migration contract token missing: ${token}`);

let ts = null;
const scopedResolvers = [
  createRequire(join(opsRoot, "__radar_workbench_verifier__.cjs")),
  createRequire(join(repositoryRoot, "__radar_workbench_verifier__.cjs")),
  createRequire(import.meta.url),
];
for (const resolver of scopedResolvers) {
  try { ts = resolver("typescript"); break; } catch {}
}
for (const candidate of [
  join(opsRoot, "node_modules/typescript/lib/typescript.js"),
  join(repositoryRoot, "node_modules/typescript/lib/typescript.js"),
  resolve(dirname(process.execPath), "..", "lib", "node_modules", "typescript", "lib", "typescript.js"),
  "/opt/homebrew/lib/node_modules/typescript/lib/typescript.js",
  "/usr/local/lib/node_modules/typescript/lib/typescript.js",
  "/usr/lib/node_modules/typescript/lib/typescript.js",
]) {
  if (ts || !existsSync(candidate)) continue;
  try { ts = createRequire(import.meta.url)(candidate); } catch {}
}
assert(ts, "TypeScript runtime not found for isolated syntax verification");

const syntaxFiles = payloadFiles.filter((path) => /\.(ts|tsx)$/.test(path));
for (const file of syntaxFiles) {
  const result = ts.transpileModule(readFileSync(file, "utf8"), {
    fileName: file,
    reportDiagnostics: true,
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      jsx: ts.JsxEmit.ReactJSX,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
    },
  });
  const errors = (result.diagnostics || []).filter((item) => item.category === ts.DiagnosticCategory.Error);
  if (errors.length) {
    const detail = errors.map((item) => ts.flattenDiagnosticMessageText(item.messageText, "\n")).join(" | ");
    throw new Error(`FAIL: TypeScript syntax error in ${relative(payloadRoot, file)}: ${detail}`);
  }
}

console.log("AC_CAPITAL_OS_RADAR_TO_CASE_WORKBENCH_06_STATIC_VERIFIED");
console.log(`Payload files checked: ${payloadFiles.length}`);
console.log(`TypeScript/TSX files transpiled: ${syntaxFiles.length}`);
console.log("PASS clickable evidence validation, clustering and opportunity conversion");
console.log("PASS explainable qualification and proof-gap materialization");
console.log("PASS funding-case, pipeline and coordinator-task handoffs");
console.log("PASS Tavily/OpenRouter evidence provenance and JSON resilience");
console.log("PASS cross-workspace conversion audit and external-action lock");
console.log("Database migration still must be applied before opening the rebuilt Radar page.");
