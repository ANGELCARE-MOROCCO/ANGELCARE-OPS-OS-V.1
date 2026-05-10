import fs from "node:fs"
import path from "node:path"

const root = process.cwd()

const required = [
  "app/(protected)/email-os/page.tsx",
  "app/(protected)/email-os/hub/page.tsx",
  "app/(protected)/email-os/admin/page.tsx",
  "app/(protected)/email-os/deployment-readiness/page.tsx",
  "app/(protected)/email-os/production-checklist/page.tsx",
  "app/(protected)/email-os/final-acceptance/page.tsx",
  "app/api/email-os/health/route.ts",
  "app/api/email-os/send/route.ts",
  "app/api/email-os/sync/route.ts",
  "app/api/email-os/queue/retry/route.ts",
  "app/api/email-os/diagnostics/route.ts",
  "app/api/email-os/backup-manifest/route.ts",
  "app/api/email-os/provider-readiness/route.ts",
  "components/email-os-core/EmailOSWorkspacePro.tsx",
  "components/email-os-core/EmailOSErrorBoundary.tsx",
  "components/email-os-core/ProviderActionsPanel.tsx",
  "components/email-os-core/ExecutiveAnalyticsBoard.tsx",
  "components/email-os-core/OpsReportPanel.tsx",
  "components/email-os-core/EmailOSNavigationHub.tsx",
  "lib/email-os-core/schema.ts",
  "lib/email-os-core/db.ts",
  "lib/email-os-core/map.ts",
  "database/email-os-core.sql"
]

console.log("\nEMAIL-OS CORE FINAL ACCEPTANCE")
console.log("==============================")

let failed = false

for (const rel of required) {
  const exists = fs.existsSync(path.join(root, rel))
  console.log(`${exists ? "✓" : "✗"} ${rel}`)
  if (!exists) failed = true
}

if (failed) {
  console.error("\nEmail-OS final acceptance failed.")
  process.exit(1)
}

console.log("\nEmail-OS final acceptance passed.")
