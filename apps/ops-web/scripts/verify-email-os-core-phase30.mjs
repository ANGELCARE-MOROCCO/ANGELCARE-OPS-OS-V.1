import fs from "node:fs"

const required = [
  "database/email-os-core-phase30-production-validation.sql",
  "lib/email-os-core/production-qa-manifest.ts",
  "lib/email-os-core/production-routes.ts",
  "app/api/email-os/production/test-sessions/route.ts",
  "app/api/email-os/production/test-results/route.ts",
  "app/api/email-os/production/monitoring-events/route.ts",
  "app/api/email-os/production/deployment-incidents/route.ts",
  "app/api/email-os/production/route-protection/route.ts",
  "app/api/email-os/production/provider-validation/route.ts",
  "app/api/email-os/production/mailbox-validation/route.ts",
  "app/api/email-os/production/readiness-score/route.ts",
  "components/email-os-core/ProductionValidationPanel.tsx",
  "components/email-os-core/DeploymentHardeningPanel.tsx",
  "components/email-os-core/RouteProtectionPanel.tsx",
  "components/email-os-core/HumanQAChecklistPanel.tsx",
  "app/(protected)/email-os/production-validation/page.tsx",
  "app/(protected)/email-os/deployment-hardening/page.tsx",
  "app/(protected)/email-os/human-qa/page.tsx"
]

console.log("\nEMAIL-OS CORE PHASE 30 VERIFY")
console.log("=============================")

let failed = false
for (const file of required) {
  const ok = fs.existsSync(file)
  console.log(`${ok ? "✓" : "✗"} ${file}`)
  if (!ok) failed = true
}

if (failed) process.exit(1)
console.log("\nPhase 30 production validation verification passed.")
