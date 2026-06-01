const fs = require("fs");
const path = require("path");

const required = [
  "lib/saas-factory/phase5-adoption-map.ts",
  "lib/saas-factory/phase5-file-scanner.ts",
  "app/api/saas-factory/adoption/targets/route.ts",
  "app/api/saas-factory/adoption/scan/route.ts",
  "app/api/saas-factory/adoption/plan/route.ts",
  "components/saas-factory/adoption/FactoryAdoptionPanel.tsx",
  "app/(protected)/saas-factory-command/adoption/page.tsx",
  "database/20260528_saas_factory_command_control_phase5_module_adoption.sql",
  "scripts/saas-factory-phase5-adoption-plan.cjs",
];

let failed = false;

console.log("SAAS FACTORY PHASE 5 MODULE ADOPTION VERIFY");
console.log("===========================================");

for (const file of required) {
  const full = path.join(process.cwd(), file);
  if (fs.existsSync(full)) {
    console.log(`✓ ${file}`);
  } else {
    failed = true;
    console.log(`✗ Missing ${file}`);
  }
}

if (failed) {
  console.error("Phase 5 verification failed.");
  process.exit(1);
}

console.log("Ready.");
