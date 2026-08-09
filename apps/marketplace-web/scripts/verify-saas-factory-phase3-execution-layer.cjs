const fs = require("fs");
const path = require("path");

const required = [
  "lib/saas-factory/phase3-runtime.ts",
  "lib/saas-factory/client.ts",
  "hooks/useSaasFactoryLiveOptions.ts",
  "app/api/saas-factory/execute/route.ts",
  "app/api/saas-factory/command/route.ts",
  "app/api/saas-factory/discovery/routes/route.ts",
  "app/api/saas-factory/discovery/apis/route.ts",
  "app/api/saas-factory/publish/route.ts",
  "app/api/saas-factory/feature-flags/evaluate/route.ts",
  "database/20260528_saas_factory_command_control_phase3_execution.sql",
];

let failed = false;

console.log("SAAS FACTORY PHASE 3 EXECUTION LAYER VERIFY");
console.log("===========================================");

for (const file of required) {
  const absolute = path.join(process.cwd(), file);
  if (!fs.existsSync(absolute)) {
    failed = true;
    console.log(`✗ Missing ${file}`);
  } else {
    console.log(`✓ ${file}`);
  }
}

const routeRoot = path.join(process.cwd(), "app", "(protected)", "saas-factory-command");
if (fs.existsSync(routeRoot)) {
  const pages = [];
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      if (entry.isFile() && entry.name === "page.tsx") pages.push(full);
    }
  }
  walk(routeRoot);
  console.log(`✓ SaaS Factory pages detected: ${pages.length}`);
  if (pages.length < 18) {
    failed = true;
    console.log("✗ Expected at least 18 SaaS Factory page routes.");
  }
} else {
  failed = true;
  console.log("✗ Missing app/(protected)/saas-factory-command");
}

if (failed) {
  console.error("Phase 3 verification failed.");
  process.exit(1);
}

console.log("Ready.");
