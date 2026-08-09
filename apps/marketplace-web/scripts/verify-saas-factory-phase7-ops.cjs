const fs = require("fs");
const path = require("path");

const required = [
  "lib/saas-factory/phase7-ops-runtime.ts",
  "app/api/saas-factory/ops/probes/run/route.ts",
  "app/api/saas-factory/ops/probes/results/route.ts",
  "app/api/saas-factory/ops/queue/enqueue/route.ts",
  "app/api/saas-factory/ops/queue/process/route.ts",
  "app/api/saas-factory/ops/incidents/from-probe/route.ts",
  "app/api/saas-factory/ops/audit/export/route.ts",
  "app/api/saas-factory/ops/modules/snapshot/route.ts",
  "app/(protected)/saas-factory-command/ops/page.tsx",
  "database/20260528_saas_factory_command_control_phase7_ops.sql",
  "scripts/saas-factory-phase7-run-ops-smoke.cjs",
];

let failed = false;

console.log("SAAS FACTORY PHASE 7 OPS VERIFY");
console.log("===============================");

for (const file of required) {
  const full = path.join(process.cwd(), file);
  if (fs.existsSync(full)) console.log(`✓ ${file}`);
  else {
    failed = true;
    console.log(`✗ Missing ${file}`);
  }
}

if (failed) {
  console.error("Phase 7 verification failed.");
  process.exit(1);
}

console.log("Ready.");
