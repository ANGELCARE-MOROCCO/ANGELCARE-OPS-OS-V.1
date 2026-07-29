#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = path.resolve(process.argv[2] || process.cwd());
const ops = path.join(root, "apps/ops-web");
const output = process.env.AC_CAPITAL_DESIGN_AUDIT_OUTPUT || "AC_CAPITAL_IC10_STATIC_DESIGN_AUDIT.json";
const workspaces = [
  ["orchestrator", "orchestrator/OrchestratorPage.tsx", "orchestrator/orchestrator.module.css"],
  ["radar", "radar/RadarPage.tsx", "radar/radar.module.css"],
  ["funders", "funders/FundersPage.tsx", "funders/funders.module.css"],
  ["qualification", "qualification/QualificationPage.tsx", "qualification/qualification.module.css"],
  ["data-room", "data-room/DataRoomPage.tsx", "data-room/data-room.module.css"],
  ["cases", "cases/CasesPage.tsx", "cases/cases.module.css"],
  ["pipeline", "pipeline/PipelinePage.tsx", "pipeline/pipeline.module.css"],
  ["approvals", "approvals/ApprovalsPage.tsx", "approvals/approvals.module.css"],
  ["coordinator", "coordinator/CoordinatorPage.tsx", "coordinator/coordinator.module.css"],
  ["artifacts", "artifacts/ArtifactsPage.tsx", "artifacts/artifacts.module.css"],
  ["reports", "reports/ReportsPage.tsx", "reports/reports.module.css"],
  ["doctrine", "doctrine/DoctrinePage.tsx", "doctrine/doctrine.module.css"],
  ["strategy", "strategy/StrategyPage.tsx", "strategy/strategy.module.css"],
  ["learning", "learning/LearningPage.tsx", "learning/learning.module.css"],
  ["ai-operations", "ai-control/AiOperationsPage.tsx", "ai-control/ai-operations.module.css"],
  ["certification", "certification/CertificationPage.tsx", "certification/certification.module.css"],
];

async function exists(file) { try { return (await stat(file)).isFile(); } catch { return false; } }
const results = [];
const cssHashes = new Map();
for (const [key, componentRel, cssRel] of workspaces) {
  const componentPath = path.join(ops, "components/ac-capital-os/pages", componentRel);
  const cssPath = path.join(ops, "components/ac-capital-os/pages", cssRel);
  const componentExists = await exists(componentPath);
  const cssExists = await exists(cssPath);
  const component = componentExists ? await readFile(componentPath, "utf8") : "";
  const css = cssExists ? await readFile(cssPath, "utf8") : "";
  const hash = css ? createHash("sha256").update(css).digest("hex") : "";
  if (hash) cssHashes.set(hash, [...(cssHashes.get(hash) || []), key]);
  const interactiveTokens = ["onClick", "button", "Drawer", "Dialog", "fetch(", "useAction", "Link"].filter((token) => component.includes(token));
  results.push({
    key,
    component: path.relative(root, componentPath),
    css: path.relative(root, cssPath),
    componentExists,
    cssExists,
    componentBytes: Buffer.byteLength(component),
    cssBytes: Buffer.byteLength(css),
    usesShell: component.includes("AcCapitalShell"),
    usesDedicatedCssModule: component.includes(path.basename(cssRel).replace(".css", "")) || component.includes('from "./'),
    interactiveTokens,
    cssSha256: hash,
    staticContractPassed: componentExists && cssExists && component.includes("AcCapitalShell") && interactiveTokens.length >= 3 && css.length >= 2500,
  });
}
const duplicateCss = [...cssHashes.entries()].filter(([, keys]) => keys.length > 1).map(([sha256, keys]) => ({ sha256, keys }));
const report = {
  generatedAt: new Date().toISOString(),
  scope: "Static design-contract audit only; not human visual certification.",
  workspaceCount: results.length,
  passed: results.filter((item) => item.staticContractPassed).length,
  failed: results.filter((item) => !item.staticContractPassed).length,
  exactDuplicateCssGroups: duplicateCss,
  results,
};
await writeFile(output, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
if (report.failed || duplicateCss.length) process.exit(2);
console.log("AC_CAPITAL_OS_IC10_STATIC_DESIGN_CONTRACT_AUDITED");
console.log("NOTE: This does not certify visual excellence, accessibility or browser behavior.");
