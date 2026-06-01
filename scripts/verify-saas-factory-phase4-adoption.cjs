const fs = require("fs");
const path = require("path");

const required = [
  "lib/saas-factory/phase4-live-options.ts",
  "hooks/useLiveFactoryOptions.ts",
  "components/saas-factory/adapters/FactoryOptionSelect.tsx",
  "app/api/saas-factory/live-options/route.ts",
  "app/api/saas-factory/live-options/bulk/route.ts",
  "app/api/saas-factory/integration/report/route.ts",
  "app/api/saas-factory/integration/bootstrap/route.ts",
  "database/20260528_saas_factory_command_control_phase4_adoption.sql",
  "scripts/saas-factory-scan-hardcoded-options.cjs",
];

let failed = false;

console.log("SAAS FACTORY PHASE 4 ADOPTION VERIFY");
console.log("====================================");

for (const file of required) {
  const full = path.join(process.cwd(), file);
  if (fs.existsSync(full)) {
    console.log(`✓ ${file}`);
  } else {
    console.log(`✗ Missing ${file}`);
    failed = true;
  }
}

if (failed) {
  console.error("Phase 4 verification failed.");
  process.exit(1);
}

console.log("Ready.");
