#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const appRoot = process.cwd();
const checks = [];
let passed = 0;
let failed = 0;

function read(relative) {
  return fs.readFileSync(path.join(appRoot, relative), "utf8");
}

function exists(relative) {
  return fs.existsSync(path.join(appRoot, relative));
}

function check(label, condition, detail = "") {
  const ok = Boolean(condition);
  checks.push({ label, ok, detail });
  if (ok) passed += 1;
  else failed += 1;
}

function contains(source, fragment) {
  return source.includes(fragment);
}

const requiredFiles = [
  "lib/hr-onboarding/types.ts",
  "lib/hr-onboarding/permissions.ts",
  "lib/hr-onboarding/validation.ts",
  "lib/hr-onboarding/server.ts",
  "lib/hr-onboarding/http.ts",
  "app/(protected)/hr/onboarding/page.tsx",
  "app/(protected)/hr/onboarding/[id]/page.tsx",
  "app/(protected)/hr/onboarding/_actions.ts",
  "app/(protected)/hr/onboarding/_components/OnboardingCommandCenter.tsx",
  "app/(protected)/hr/onboarding/checklists/page.tsx",
  "app/(protected)/hr/onboarding/checklists/ChecklistLibraryClient.tsx",
  "app/api/hr/onboarding/workspace/route.ts",
  "app/api/hr/onboarding/journeys/route.ts",
  "app/api/hr/onboarding/journeys/[journeyKey]/route.ts",
  "app/api/hr/onboarding/journeys/[journeyKey]/actions/route.ts",
  "app/api/hr/onboarding/journeys/[journeyKey]/tasks/route.ts",
  "app/api/hr/onboarding/tasks/[taskKey]/route.ts",
  "app/api/hr/onboarding/journeys/[journeyKey]/documents/route.ts",
  "app/api/hr/onboarding/documents/[documentKey]/route.ts",
  "app/api/hr/onboarding/documents/[documentKey]/upload/route.ts",
  "app/api/hr/onboarding/documents/[documentKey]/download/route.ts",
  "app/api/hr/onboarding/journeys/[journeyKey]/activity/route.ts",
  "app/api/hr/onboarding/checklists/route.ts",
  "app/api/hr/onboarding/checklists/[checklistKey]/actions/route.ts",
  "supabase/migrations/20260804_hr_onboarding_production_completion.sql",
  "tsconfig.hr-onboarding-production-completion.json",
];

for (const file of requiredFiles) check(`file ${file}`, exists(file));

const ui = read("app/(protected)/hr/onboarding/_components/OnboardingCommandCenter.tsx");
const checklistUi = read("app/(protected)/hr/onboarding/checklists/ChecklistLibraryClient.tsx");
const server = read("lib/hr-onboarding/server.ts");
const permissions = read("lib/hr-onboarding/permissions.ts");
const lifecycle = read("lib/hr-production/lifecycle.ts");
const sourceTruth = read("lib/hr-production/source-of-truth.ts");
const migration = read("supabase/migrations/20260804_hr_onboarding_production_completion.sql");
const allNewSource = [ui, checklistUi, server, permissions, lifecycle, sourceTruth,
  ...requiredFiles.filter((file) => file.endsWith(".ts") || file.endsWith(".tsx")).filter(exists).map(read),
].join("\n");

check("no localStorage", !/\blocalStorage\b/.test(allNewSource));
check("no sessionStorage", !/\bsessionStorage\b/.test(allNewSource));
check("no IndexedDB", !/\bindexedDB\b/i.test(allNewSource));
check("no page reload", !/window\.location\.reload/.test(allNewSource));
check("no browser alert", !/\balert\s*\(/.test(allNewSource));
check("no browser confirm", !/\bconfirm\s*\(/.test(allNewSource));
check("no mailto", !/mailto:/i.test(allNewSource));
check("no href hash placeholder", !/href=["']#["']/.test(allNewSource));
check("no TypeScript suppression", !/@ts-ignore|@ts-expect-error|@ts-nocheck/.test(allNewSource));
check("no explicit as any", !/\bas\s+any\b/.test(allNewSource));
check("no unsafe double cast", !/\bas\s+unknown\s+as\b/.test(allNewSource));
check("no fake fallback journeys", !/fallbackJourney|mockJourney|demoJourney|fakeJourney/i.test(ui));
check("no generated browser tasks", !/defaultTasks|generatedTasks|taskOverrides|deletedTaskIds/i.test(ui));
check("no temporary local IDs", !/temp[-_]?id|local[-_]?id/i.test(ui));
check("real empty state", contains(ui, "Aucun parcours onboarding enregistré"));
check("real source warning state", contains(ui, "Diagnostic de sources optionnelles"));
check("journey mutation progress", contains(ui, "Mutation transactionnelle"));
check("archive confirmation", contains(ui, "Archiver ce parcours"));
check("restore journey", contains(ui, 'journeyAction("restore"'));
check("document upload", contains(ui, "/upload"));
check("document download", contains(ui, "/download"));
check("all command tabs", ["Tâches", "Documents", "Timeline", "Checklist", "Notes", "Activité"].every((value) => ui.includes(value)));
check("owner keys use canonical identities", contains(ui, 'name="ownerKey"') && contains(ui, 'name="managerKey"'));
check("server uses canonical RPC", contains(server, 'rpc("hr_onboarding_execute"'));
check("server service client", contains(server, "createServiceClient"));
check("server revalidates onboarding routes", contains(server, "revalidateOnboarding"));
check("version conflict handling", contains(server, "OnboardingConcurrencyError"));
check("no table-name guessing", !/onboarding_journeys|employee_onboarding/.test(server.replaceAll("hr_onboarding_journeys", "")));
check("scope required for non-sovereign", contains(permissions, "ONBOARDING_SCOPE_UNRESOLVED"));
check("strict scope filtering", contains(server, "actor.sovereign") && contains(server, "tenant !== actor.tenantKey"));
check("optional source warnings surfaced", contains(server, "sourceWarnings") && contains(server, "warning:"));
check("canonical source of truth journeys", contains(sourceTruth, "onboardingJourneys: 'hr_onboarding_journeys'"));
check("canonical source of truth tasks", contains(sourceTruth, "onboardingTasks: 'hr_onboarding_tasks'"));
check("canonical source of truth documents", contains(sourceTruth, "onboardingDocuments: 'hr_onboarding_documents'"));
check("candidate conversion ensures journey", contains(lifecycle, "hr_onboarding_ensure_journey"));
check("candidate conversion compensation", contains(lifecycle, "compensateStaffBundle"));
check("candidate conversion checks write errors", contains(lifecycle, "ancillaryWrites") && contains(lifecycle, "writeError"));

check("migration transaction begin", /^begin;/m.test(migration));
check("migration transaction commit", /commit;\s*$/m.test(migration));
check("migration canonical journeys", contains(migration, "hr_onboarding_journeys"));
check("migration canonical tasks", contains(migration, "hr_onboarding_tasks"));
check("migration canonical documents", contains(migration, "hr_onboarding_documents"));
check("migration immutable activity", contains(migration, "hr_onboarding_activity_immutable") && contains(migration, "ONBOARDING_ACTIVITY_IMMUTABLE"));
check("migration checklist assignments", contains(migration, "hr_onboarding_checklist_assignments"));
check("migration idempotency", contains(migration, "hr_onboarding_idempotency") && contains(migration, "pg_advisory_xact_lock"));
check("migration versioning", contains(migration, "version = version + 1"));
check("migration progress function", contains(migration, "hr_onboarding_recalculate_progress"));
check("migration gate function", contains(migration, "hr_onboarding_gate_ready"));
check("migration transactional executor", contains(migration, "hr_onboarding_execute"));
check("migration lifecycle ensure function", contains(migration, "hr_onboarding_ensure_journey"));
check("migration standard checklist", contains(migration, "angelcare-standard-onboarding-v1"));
check("migration private storage bucket", contains(migration, "hr-onboarding-documents") && contains(migration, "false, 20971520"));
check("migration touch triggers", ["journeys_touch_updated_at", "tasks_touch_updated_at", "documents_touch_updated_at", "checklists_touch_updated_at"].every((value) => migration.includes(value)));
check("migration tenant scope enforcement", contains(migration, "v_sovereign") && contains(migration, "organization_key = v_organization"));
check("migration no permissive using true", !/using\s*\(\s*true\s*\)/i.test(migration));
check("migration no permissive with check true", !/with\s+check\s*\(\s*true\s*\)/i.test(migration));
check("migration revokes authenticated", contains(migration, "revoke all on public.hr_onboarding_journeys from anon, authenticated"));
check("migration service role grants", contains(migration, "grant execute on function public.hr_onboarding_execute"));
check("migration no destructive drop table", !/drop\s+table/i.test(migration));
check("migration no truncate", !/\btruncate\b/i.test(migration));
check("migration no mass delete", !/delete\s+from\s+public\.hr_onboarding/i.test(migration));

const apiFiles = requiredFiles.filter((file) => file.startsWith("app/api/") && file.endsWith("route.ts"));
for (const file of apiFiles) {
  const source = read(file);
  check(`${file} force dynamic`, contains(source, 'dynamic = "force-dynamic"'));
  check(`${file} revalidate zero`, contains(source, "revalidate = 0"));
  check(`${file} structured error`, contains(source, "onboardingErrorResponse"));
}

console.log("========================================================================");
console.log("ANGELCARE — HR ONBOARDING PRODUCTION COMPLETION STATIC ACCEPTANCE");
console.log("========================================================================");
for (const item of checks) console.log(`${item.ok ? "PASS" : "FAIL"}  ${item.label}${item.detail ? ` — ${item.detail}` : ""}`);
console.log();
console.log(`Checks passed: ${passed}`);
console.log(`Checks failed: ${failed}`);
console.log("Production build: NO");
console.log("Git mutation:     NO");
console.log();
if (failed) {
  console.error("✖ HR ONBOARDING PRODUCTION COMPLETION STATIC ACCEPTANCE FAILED");
  process.exit(1);
}
console.log("✓ HR ONBOARDING PRODUCTION COMPLETION STATIC ACCEPTANCE PASSED");
