#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const checks = [
  ["apps/ops-web/components/ac-capital-os/pages/orchestrator/OrchestratorPage.tsx", "set-agent-enabled"],
  ["apps/ops-web/components/ac-capital-os/pages/orchestrator/orchestrator.module.css", ".lifecycleBoard"],
  ["apps/ops-web/lib/ac-capital-os/server/capital-orchestrator.ts", "processCapitalEventById"],
  ["apps/ops-web/components/ac-capital-os/core/Overlay.tsx", "createPortal"],
  ["apps/ops-web/components/ac-capital-os/core/core.module.css", "AC_CAPITAL_OVERHEAD_SAFE_PORTAL_08"],
];
for (const [relative, marker] of checks) {
  const file = path.join(root, relative);
  if (!fs.existsSync(file)) throw new Error(`FAIL: Missing ${relative}`);
  if (!fs.readFileSync(file, "utf8").includes(marker)) throw new Error(`FAIL: Marker missing in ${relative}: ${marker}`);
}
console.log("AC_CAPITAL_OS_EXECUTIVE_ORCHESTRATOR_COMMAND_WORKBENCH_08_STATIC_VERIFIED");
console.log("No TypeScript, build, SQL, Git, provider request or deployment command was run.");
