import fs from "node:fs"
import path from "node:path"

const required = [
  "database/email-os-core-phase21.sql",
  "app/api/email-os/analytics/aggregate/route.ts",
  "app/api/email-os/reporting/snapshot/route.ts",
  "components/email-os-core/AnalyticsReportingPanel.tsx",
  "app/(protected)/email-os/analytics/page.tsx"
]

console.log("\nEMAIL-OS CORE PHASE 21 VERIFY")
console.log("=============================")

let failed = false

for (const rel of required) {
  const ok = fs.existsSync(path.join(process.cwd(), rel))
  console.log(`${ok ? "✓" : "✗"} ${rel}`)
  if (!ok) failed = true
}

if (failed) process.exit(1)

console.log("\nEmail-OS core phase 21 verify passed.")
