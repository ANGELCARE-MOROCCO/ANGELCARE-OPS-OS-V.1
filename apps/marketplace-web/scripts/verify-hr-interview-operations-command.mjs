#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const exists = (relative) => fs.existsSync(path.join(root, relative));
const checks = [];
const add = (name, pass, detail = "") => checks.push({ name, pass: Boolean(pass), detail });

const files = {
  page: "app/(protected)/hr/recruitment/interviews/page.tsx",
  client: "app/(protected)/hr/recruitment/interviews/InterviewOperationsCommandClient.tsx",
  css: "app/(protected)/hr/recruitment/interviews/InterviewOperationsCommand.module.css",
  actions: "app/(protected)/hr/recruitment/_actions.ts",
  server: "lib/hr-recruitment/interviews/server.ts",
  types: "lib/hr-recruitment/interviews/types.ts",
  collectionApi: "app/api/hr/recruitment/interviews/route.ts",
  recordApi: "app/api/hr/recruitment/interviews/[id]/route.ts",
  actionApi: "app/api/hr/recruitment/interviews/[id]/actions/route.ts",
  migration: "supabase/migrations/20260804_hr_interview_operations_command.sql",
  tsconfig: "tsconfig.hr-interview-operations-command.json",
};

for (const [key, value] of Object.entries(files)) add(`file:${key}`, exists(value), value);
if (checks.some((item) => !item.pass)) {
  console.error("Missing required files.");
} else {
  const page = read(files.page);
  const client = read(files.client);
  const server = read(files.server);
  const actions = read(files.actions);
  const migration = read(files.migration);
  const allCode = [page, client, server, actions, read(files.collectionApi), read(files.recordApi), read(files.actionApi)].join("\n");

  add("page uses focused command snapshot", page.includes("getInterviewCommandSnapshot"));
  add("page no whole HR dashboard read", !page.includes("getHRDashboardData"));
  add("page no legacy interview server actions", !page.includes("scheduleRecruitmentInterview"));
  add("client is interactive", client.includes('"use client"'));
  add("premium command title", client.includes("Entretiens & Évaluation"));
  add("agenda view", client.includes('"agenda"'));
  add("week view", client.includes('"week"'));
  add("queue view", client.includes('"queue"'));
  add("feedback view", client.includes('"feedback"'));
  add("create modal", client.includes("Planifier un entretien"));
  add("edit modal", client.includes("Modifier et resynchroniser"));
  add("cancel modal", client.includes("Annuler l’entretien"));
  add("decision modal", client.includes("Décision rapide"));
  add("task modal", client.includes("Créer une tâche liée"));
  add("comment modal", client.includes("Ajouter une note interne"));
  add("feedback modal", client.includes("Soumettre le feedback"));
  add("no decorative view options", !client.includes("View Options"));
  add("no href hash fallback", !client.includes('href="#"'));
  add("no mailto", !allCode.includes("mailto:"));
  add("no hardcoded legacy interviewer", !allCode.includes("Salma El Alami"));
  add("real interviewer source", server.includes("INTERVIEWER_TABLES"));
  add("canonical multi-round table", server.includes('const INTERVIEW_TABLE = "hr_interviews"'));
  add("activity evidence table", server.includes('const ACTIVITY_TABLE = "hr_interview_activity"'));
  add("Casablanca timezone", server.includes('const TIMEZONE = "Africa/Casablanca"'));
  add("timezone-aware conversion", server.includes("zonedLocalToIso"));
  add("conflict detection", server.includes("findConflicts"));
  add("concurrency protection", server.includes('eq("version", input.version)'));
  add("candidate snapshot synchronization", server.includes("synchronizeCandidateSnapshot"));
  add("mandatory activity write", server.includes("writeActivity"));
  add("preparation task verification", server.includes("createPreparationTask"));
  add("multiple candidate table compatibility", server.includes("hr_recruitment_candidates"));
  add("route revalidation recruitment root", server.includes('"/hr/recruitment"'));
  add("route revalidation candidates", server.includes('"/hr/recruitment/candidates"'));
  add("route revalidation kanban", server.includes('"/hr/recruitment/kanban"'));
  add("route revalidation employees", server.includes('"/hr/employees"'));
  add("legacy root create action delegates canonical", actions.includes("await createInterview"));
  add("collection GET", read(files.collectionApi).includes("export async function GET"));
  add("collection POST", read(files.collectionApi).includes("export async function POST"));
  add("record PATCH", read(files.recordApi).includes("export async function PATCH"));
  add("record controlled DELETE", read(files.recordApi).includes("export async function DELETE"));
  add("action POST", read(files.actionApi).includes("export async function POST"));
  add("API no-store", allCode.includes('"cache-control": "private, no-store"'));
  add("migration transaction", migration.includes("begin;") && migration.includes("commit;"));
  add("migration canonical interviews", migration.includes("create table if not exists public.hr_interviews"));
  add("migration activity evidence", migration.includes("create table if not exists public.hr_interview_activity"));
  add("migration candidate snapshot columns", migration.includes("next_interview_id"));
  add("migration idempotent backfill", migration.includes("not exists (\n            select 1\n            from public.hr_interviews"));
  add("migration indexes", migration.includes("idx_hr_interviews_scheduled_at"));
  add("migration no destructive drop table", !/drop\s+table/i.test(migration));
  add("no TypeScript suppressions", !/@ts-ignore|@ts-expect-error/.test(allCode));
  add("no unsafe double cast", !/as\s+unknown\s+as/.test(allCode));
  add("no explicit as any", !/as\s+any\b/.test(allCode));
}

const failed = checks.filter((item) => !item.pass);
console.log("=".repeat(72));
console.log("ANGELCARE — HR INTERVIEW OPERATIONS COMMAND STATIC ACCEPTANCE");
console.log("=".repeat(72));
for (const item of checks) console.log(`${item.pass ? "PASS" : "FAIL"}  ${item.name}${item.detail ? ` — ${item.detail}` : ""}`);
console.log();
console.log(`Checks passed: ${checks.length - failed.length}`);
console.log(`Checks failed: ${failed.length}`);
console.log("Production build: NO");
console.log("Git mutation:     NO");
if (failed.length) process.exit(1);
console.log();
console.log("✓ HR INTERVIEW OPERATIONS COMMAND STATIC ACCEPTANCE PASSED");
