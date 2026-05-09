import fs from "node:fs"
import path from "node:path"

const root = process.cwd()

const checks = [
  "lib/email-os/real/table-map.ts",
  "lib/email-os/real/real-db.ts",
  "lib/email-os/real/normalizers.ts",
  "lib/email-os/real/client.ts",
  "app/api/email-os/real/[entity]/route.ts",
  "app/api/email-os/real/[entity]/[id]/route.ts",
  "app/api/email-os/real/provider-health/route.ts",
  "components/email-os/real-workspace/RealWorkspaceShell.tsx",
  "components/email-os/real-workspace/RealEntityWorkspace.tsx",
  "components/email-os/real-workspace/ConfigurationLiveWorkspace.tsx",
  "components/email-os/real-workspace/AnalyticsLiveWorkspace.tsx",
  "app/(protected)/email-os/mailboxes/page.tsx",
  "app/(protected)/email-os/configuration/page.tsx",
  "app/(protected)/email-os/templates/page.tsx",
  "app/(protected)/email-os/automation/page.tsx",
  "app/(protected)/email-os/approvals/page.tsx",
  "app/(protected)/email-os/outbox/page.tsx",
  "app/(protected)/email-os/audit/page.tsx",
  "app/(protected)/email-os/runtime/page.tsx",
  "database/email-os/email-os-real-workspace-final.sql"
]

console.log("\nEMAIL-OS REAL WORKSPACE FINAL QA")
console.log("================================")

let failed = false
for (const rel of checks) {
  const ok = fs.existsSync(path.join(root, rel))
  console.log(`${ok ? "✓" : "✗"} ${rel}`)
  if (!ok) failed = true
}

if (failed) {
  console.error("\nEmail-OS real workspace final QA failed.")
  process.exit(1)
}

console.log("\nEmail-OS real workspace final QA passed.")
