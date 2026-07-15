import fs from "node:fs"
import path from "node:path"

const required = [
  "database/email-os-core-phase13.sql",
  "app/api/email-os/governance/retention-policies/route.ts",
  "app/api/email-os/governance/deleted-records/route.ts",
  "app/api/email-os/governance/recover/route.ts",
  "app/api/email-os/governance/audit-summary/route.ts",
  "components/email-os-core/GovernancePanel.tsx",
  "app/(protected)/email-os/governance/page.tsx"
]

console.log("\nEMAIL-OS CORE PHASE 13 VERIFY")
console.log("=============================")

let failed = false

for (const rel of required) {
  const ok = fs.existsSync(path.join(process.cwd(), rel))
  console.log(`${ok ? "✓" : "✗"} ${rel}`)
  if (!ok) failed = true
}

if (failed) process.exit(1)

console.log("\nEmail-OS core phase 13 verify passed.")
