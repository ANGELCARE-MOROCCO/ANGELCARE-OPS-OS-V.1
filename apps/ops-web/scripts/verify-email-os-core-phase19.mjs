import fs from "node:fs"
import path from "node:path"

const required = [
  "database/email-os-core-phase19.sql",
  "app/api/email-os/sync-schedules/route.ts",
  "app/api/email-os/sync-jobs/route.ts",
  "app/api/email-os/sync-history/route.ts",
  "app/api/email-os/sync-jobs/[id]/run/route.ts",
  "components/email-os-core/SyncOperationsPanel.tsx",
  "app/(protected)/email-os/sync-operations/page.tsx"
]

console.log("\nEMAIL-OS CORE PHASE 19 VERIFY")
console.log("=============================")

let failed = false
for (const rel of required) {
  const ok = fs.existsSync(path.join(process.cwd(), rel))
  console.log(`${ok ? "✓" : "✗"} ${rel}`)
  if (!ok) failed = true
}
if (failed) process.exit(1)
console.log("\nEmail-OS core phase 19 verify passed.")
