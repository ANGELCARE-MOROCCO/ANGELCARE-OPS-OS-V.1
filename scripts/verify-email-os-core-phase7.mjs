import fs from "node:fs"
import path from "node:path"

const required = [
  "app/api/email-os/analytics/route.ts",
  "app/api/email-os/sla-breaches/route.ts",
  "components/email-os-core/ExecutiveAnalyticsBoard.tsx",
  "app/(protected)/email-os/admin/page.tsx"
]

console.log("\nEMAIL-OS CORE PHASE 7 VERIFY")
console.log("============================")

let failed = false

for (const rel of required) {
  const ok = fs.existsSync(path.join(process.cwd(), rel))
  console.log(`${ok ? "✓" : "✗"} ${rel}`)
  if (!ok) failed = true
}

if (failed) process.exit(1)

console.log("\nEmail-OS core phase 7 verify passed.")
