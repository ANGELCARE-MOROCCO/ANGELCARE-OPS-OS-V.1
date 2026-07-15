const fs = require("fs");
const path = require("path");

const required = [
  "components/saas-factory/adapters/ModuleLiveFields.tsx",
  "lib/saas-factory/phase6-module-field-map.ts",
  "lib/saas-factory/phase6-report.ts",
  "app/api/saas-factory/phase6/replacements/route.ts",
  "app/api/saas-factory/phase6/health/route.ts",
  "app/(protected)/saas-factory-command/phase6/page.tsx",
  "database/20260528_saas_factory_command_control_phase6_live_field_adoption.sql",
  "scripts/saas-factory-phase6-apply-live-fields.cjs",
];

let failed = false;

console.log("SAAS FACTORY PHASE 6 LIVE FIELD ADOPTION VERIFY");
console.log("===============================================");

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
  console.error("Phase 6 verification failed.");
  process.exit(1);
}

console.log("Ready.");
