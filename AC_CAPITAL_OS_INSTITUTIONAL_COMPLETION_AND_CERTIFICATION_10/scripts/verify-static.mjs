#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const packageRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const manifest = JSON.parse(await readFile(path.join(packageRoot, "APPLIED_FILES_MANIFEST.json"), "utf8"));

async function exists(candidate) { try { return (await stat(candidate)).isFile(); } catch { return false; } }
async function locateRepository() {
  for (const candidate of [process.cwd(), path.resolve(process.cwd(), ".."), path.resolve(packageRoot, "..")]) {
    if (await exists(path.join(candidate, "apps/ops-web/package.json"))) return candidate;
  }
  throw new Error("AC_CAPITAL_IC10_REPOSITORY_NOT_FOUND");
}
const root = await locateRepository();
const ops = path.join(root, "apps/ops-web");

// IC10_TYPESCRIPT_RESOLUTION_FROM_OPS_WEB
const requireFromOpsWeb = createRequire(
  path.join(ops, "package.json"),
);

let ts;

try {
  ts = requireFromOpsWeb("typescript");
} catch (error) {
  const message =
    error instanceof Error
      ? error.message
      : String(error);

  throw new Error(
    "IC10_TYPESCRIPT_RUNTIME_NOT_FOUND_IN_OPS_WEB:"
    + message,
  );
}

const sha = (bytes) =>
  createHash("sha256").update(bytes).digest("hex");
const diagnostics = [];
let transpiled = 0;

for (const entry of manifest.files) {
  const target = path.join(root, entry.target);
  if (!(await exists(target))) throw new Error(`IC10_TARGET_MISSING:${entry.target}`);
  const bytes = await readFile(target);
  if (sha(bytes) !== entry.sha256) throw new Error(`IC10_TARGET_HASH_MISMATCH:${entry.target}`);
  if (/\.tsx?$/.test(target)) {
    transpiled += 1;
    const result = ts.transpileModule(bytes.toString("utf8"), {
      fileName: target,
      reportDiagnostics: true,
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ESNext,
        jsx: ts.JsxEmit.ReactJSX,
      },
    });
    for (const item of result.diagnostics || []) {
      if (item.category === ts.DiagnosticCategory.Error) diagnostics.push(`${entry.target}: ${ts.flattenDiagnosticMessageText(item.messageText, "\n")}`);
    }
  }
}
if (diagnostics.length) throw new Error(`IC10_TYPESCRIPT_SYNTAX_FAILED\n${diagnostics.join("\n")}`);

const overlay = await readFile(path.join(ops, "components/ac-capital-os/core/Overlay.tsx"), "utf8");
const coreCss = await readFile(path.join(ops, "components/ac-capital-os/core/core.module.css"), "utf8");
if (!overlay.includes("createPortal") || !overlay.includes("document.body")) throw new Error("IC10_BODY_PORTAL_CONTRACT_MISSING");
if (!coreCss.includes("--angelcare-overhead-height") || !coreCss.includes("backdrop-filter: none")) throw new Error("IC10_OVERHEAD_OR_GPU_SAFE_OVERLAY_CONTRACT_MISSING");

const approvalRoute = await readFile(path.join(ops, "app/api/ac-capital-os/approvals/[id]/decision/route.ts"), "utf8");
if (!approvalRoute.includes("AC_CAPITAL_APPROVAL_VERSION_CONFLICT") || !approvalRoute.includes("request-revision") || !approvalRoute.includes("ac_capital_ic10_decide_approval")) throw new Error("IC10_APPROVAL_VERSION_CONTRACT_MISSING");
const caseRoute = await readFile(path.join(ops, "app/api/ac-capital-os/case-builder/route.ts"), "utf8");
if (!caseRoute.includes("ac_capital_ic10_request_case_approval")) throw new Error("IC10_ATOMIC_APPROVAL_REQUEST_CONTRACT_MISSING");
const pipelineRoute = await readFile(path.join(ops, "app/api/ac-capital-os/capital-pipeline/route.ts"), "utf8");
if (!pipelineRoute.includes("ac_capital_ic10_record_submission")) throw new Error("IC10_ATOMIC_SUBMISSION_CONTRACT_MISSING");

const certificationRuntime = await readFile(path.join(ops, "lib/ac-capital-os/server/institutional-certification.ts"), "utf8");
if ((certificationRuntime.match(/key: "[^"]+"/g) || []).length < 15) throw new Error("IC10_WORKSPACE_CONTRACTS_INCOMPLETE");
for (const token of ["grant-lifecycle", "bank-financing", "provider-failure", "approval-version", "artifact-integrity"]) {
  if (!certificationRuntime.includes(token)) throw new Error(`IC10_SCENARIO_CONTRACT_MISSING:${token}`);
}
const sql = await readFile(path.join(root, "supabase/migrations/20260729_ac_capital_os_institutional_completion_certification_10.sql"), "utf8");
for (const token of ["ac_capital_ic10_request_case_approval", "ac_capital_ic10_decide_approval", "ac_capital_ic10_record_submission", "for select to authenticated", "to service_role"]) {
  if (!sql.includes(token)) throw new Error(`IC10_SQL_CONTRACT_MISSING:${token}`);
}

const certificationPage = await readFile(path.join(ops, "components/ac-capital-os/pages/certification/CertificationPage.tsx"), "utf8");
for (const token of ["CERTIFIED", "PARTIALLY CERTIFIED", "BLOCKED", "FAILED", "NOT TESTED", "Board sign-off"]) {
  if (!certificationPage.includes(token)) throw new Error(`IC10_CERTIFICATION_UI_TOKEN_MISSING:${token}`);
}

console.log("AC_CAPITAL_OS_INSTITUTIONAL_COMPLETION_AND_CERTIFICATION_10_STATIC_VERIFIED");
console.log(`Installed payload hashes verified: ${manifest.files.length}`);
console.log(`TypeScript/TSX syntax-transpiled: ${transpiled}`);
console.log("PASS body-level overhead-safe GPU-safe overlays");
console.log("PASS atomic exact-version approval request and decision contracts");
console.log("PASS atomic proof-controlled submission contract");
console.log("PASS server-authoritative read-only certification RLS contract");
console.log("PASS honest five-state certification UI");
