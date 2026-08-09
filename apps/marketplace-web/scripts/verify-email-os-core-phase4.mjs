import fs from "node:fs"
import path from "node:path"

const required = [
  "database/email-os-core-phase4.sql",
  "app/api/email-os/approvals/route.ts",
  "app/api/email-os/approvals/[id]/decision/route.ts",
  "app/api/email-os/notes/route.ts",
  "app/api/email-os/sla-rules/route.ts",
  "app/api/email-os/assign/route.ts",
  "app/api/email-os/command-center/route.ts",
  "components/email-os-core/EnterpriseCommandCenter.tsx",
  "components/email-os-core/ApprovalsPanel.tsx"
]

console.log("\nEMAIL-OS CORE PHASE 4 VERIFY")
console.log("============================")
let failed = false
for (const rel of required) {
  const ok = fs.existsSync(path.join(process.cwd(), rel))
  console.log(`${ok ? "✓" : "✗"} ${rel}`)
  if (!ok) failed = true
}
if (failed) process.exit(1)
console.log("\nEmail-OS core phase 4 verify passed.")
