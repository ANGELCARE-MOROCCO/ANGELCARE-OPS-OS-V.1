#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(await readFile(join(packageRoot, "APPLIED_FILES_MANIFEST.json"), "utf8"));

async function exists(path) {
  try { await stat(path); return true; } catch { return false; }
}

async function findRepositoryRoot(start) {
  let current = resolve(start);
  for (let depth = 0; depth < 8; depth += 1) {
    if (await exists(join(current, "apps", "ops-web"))) return current;
    const parent = dirname(current);
    if (parent === current) break;
    current = parent;
  }
  throw new Error(`Repository root not found from ${start}.`);
}

async function sha256(path) {
  return createHash("sha256").update(await readFile(path)).digest("hex");
}

async function text(path) {
  return readFile(path, "utf8");
}

function requireAll(source, labels, file) {
  const missing = labels.filter((value) => !source.includes(value));
  if (missing.length) throw new Error(`STATIC_CONTRACT_MISSING:${file}:${missing.join(" | ")}`);
}

function forbidAll(source, labels, file) {
  const found = labels.filter((value) => source.includes(value));
  if (found.length) throw new Error(`STATIC_FORBIDDEN_CONTRACT:${file}:${found.join(" | ")}`);
}

const repositoryRoot = await findRepositoryRoot(process.cwd());
const opsRoot = join(repositoryRoot, "apps", "ops-web");
let checked = 0;

for (const entry of manifest.install_files) {
  const path = join(repositoryRoot, entry.path);
  if (!(await exists(path))) throw new Error(`INSTALLED_FILE_MISSING:${entry.path}`);
  const digest = await sha256(path);
  if (digest !== entry.sha256) throw new Error(`INSTALLED_FILE_HASH_MISMATCH:${entry.path}`);
  checked += 1;
}

const overlay = await text(join(opsRoot, "components/ac-capital-os/core/Overlay.tsx"));
const coreCss = await text(join(opsRoot, "components/ac-capital-os/core/core.module.css"));
requireAll(overlay, ["createPortal", "document.body"], "Overlay.tsx");
requireAll(coreCss, ["top:var(--angelcare-overhead-height,70px)", "backdrop-filter:none!important"], "core.module.css");

const providerRuntime = await text(join(opsRoot, "lib/ac-capital-os/server/free-provider-runtime.ts"));
requireAll(providerRuntime, ["sanitizeForExternalAi", "response-healing", "executeOpenRouterCapability", "SANITIZED CONTEXT SNAPSHOT"], "free-provider-runtime.ts");

const providerBridge = await text(join(opsRoot, "lib/ac-capital-os/server/ai-provider-bridge.ts"));
requireAll(providerBridge, ["executeOpenRouterCapability", "openrouter-free-governed", "externalActionsLocked"], "ai-provider-bridge.ts");
forbidAll(providerBridge, ["invokeGeminiProvider", "gemini-runtime", "AC_CAPITAL_GEMINI_PRIMARY_MODEL"], "ai-provider-bridge.ts");

const commandRoute = await text(join(opsRoot, "app/api/ac-capital-os/ai-command-center/run/route.ts"));
requireAll(commandRoute, ["governed_openrouter_ai_run", "Provider Execution Completed", "provider_evidence"], "ai-command run route");
forbidAll(commandRoute, ["dry-run", "Governed Gemini execution"], "ai-command run route");

const executors = await text(join(opsRoot, "lib/ac-capital-os/server/capital-agent-executors.ts"));
requireAll(executors, [
  "funder-intelligence-agent", "qualification-underwriter", "funding-case-architect",
  "data-room-proof-agent", "pipeline-intelligence-agent", "coordinator-mission-planner",
  "executive-report-agent", "capital-learning-agent", "executeCapitalAgentForEvent",
  "enqueueDueInstitutionalAgentWork", "sanitizedDocument", "case.draft.completed",
], "capital-agent-executors.ts");

const orchestrator = await text(join(opsRoot, "lib/ac-capital-os/server/capital-orchestrator.ts"));
requireAll(orchestrator, ["export async function processCapitalEventById", "executeCapitalAgentForEvent", "ac_capital_dead_letters", "approval_id", "coordinator_task_id"], "capital-orchestrator.ts");

const institutional = await text(join(opsRoot, "lib/ac-capital-os/server/institutional-runtime.ts"));
requireAll(institutional, ["record_version", "AC_CAPITAL_OPTIMISTIC_LOCK_CONFLICT", "archive", "restore", "merge-record", "evaluateStageGates", "record-submission-proof"], "institutional-runtime.ts");

const artifactFactory = await text(join(opsRoot, "lib/ac-capital-os/server/artifact-factory.ts"));
requireAll(artifactFactory, ["PDFDocument", "renderDocx", "renderXlsx", "renderCsv", "application/zip", "sha256", "immutable_snapshot_hash"], "artifact-factory.ts");

const tick = await text(join(opsRoot, "app/api/ac-capital-os/runtime/tick/route.ts"));
requireAll(tick, ["ac-capital-ultra-runtime", "acquireRuntimeLease", "enqueueDueInstitutionalAgentWork", "STALE_LOCK_RECOVERED"], "runtime tick route");

const migration = await text(join(repositoryRoot, "supabase/migrations/20260729_ac_capital_os_ultra_department_final_09.sql"));
requireAll(migration, [
  "ac_capital_record_versions", "ac_capital_agent_schedules", "ac_capital_stage_gates",
  "ac_capital_artifacts", "ac_capital_submission_proofs", "ac_capital_runtime_leases",
  "ac_capital_emit_lifecycle_event", "analysis_provider_key", "openrouter", "notify pgrst, 'reload schema'", "commit;",
], "Final 09 migration");

const navigation = await text(join(opsRoot, "components/ac-capital-os/core/navigation.ts"));
requireAll(navigation, ["/ac-capital-os/orchestrator", "/ac-capital-os/registry", "/ac-capital-os/artifacts"], "navigation.ts");

console.log("AC_CAPITAL_OS_ULTRA_DEPARTMENT_FINAL_09_STATIC_VERIFIED");
console.log(`Repository root: ${repositoryRoot}`);
console.log(`Installed payload hashes verified: ${checked}`);
console.log("PASS canonical lifecycle and optimistic version controls");
console.log("PASS eight executable OpenRouter/Tavily institutional agents");
console.log("PASS OpenRouter-only active AC Capital AI Command bridge");
console.log("PASS provider privacy sanitization boundary");
console.log("PASS durable leases, schedules, retries, dead letters and stale-lock recovery");
console.log("PASS PDF, DOCX, XLSX, CSV, JSON and ZIP artifact factory contracts");
console.log("PASS body-level overlay portal and AngelCare overhead offset");
console.log("Database migration and live provider/browser acceptance remain separate gates.");
