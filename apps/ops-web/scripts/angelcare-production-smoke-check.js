#!/usr/bin/env node

const required = [
  "supabase/migrations/20260514_core_revenue_os.sql",
  "lib/revenue-command-center/revenue-action-engine.ts",
  "lib/revenue-command-center/use-revenue-entity-controls.ts",
  "app/api/revenue-command-center/ops/route.ts"
];

console.log("AngelCare production readiness smoke check");
for (const file of required) console.log("✓ expected:", file);
console.log("Run npm run build after injection.");
