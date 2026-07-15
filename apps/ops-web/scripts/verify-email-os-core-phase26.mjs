import fs from "node:fs"
import path from "node:path"

const required = [
  "database/email-os-core-phase26.sql",
  "app/api/email-os/executive/actions/route.ts",
  "app/api/email-os/executive/actions/[id]/execute/route.ts",
  "app/api/email-os/executive/interventions/route.ts",
  "app/api/email-os/executive/run-policy-execution/route.ts",
  "components/email-os-core/ExecutiveExecutionPanel.tsx",
  "app/(protected)/email-os/executive-execution/page.tsx"
]

console.log("\nEMAIL-OS CORE PHASE 26 VERIFY")
console.log("=============================")

let failed = false
for (const rel of required) {
  const ok = fs.existsSync(path.join(process.cwd(), rel))
  console.log(`${ok ? "✓" : "✗"} ${rel}`)
  if (!ok) failed = true
}
if (failed) process.exit(1)
console.log("\nEmail-OS core phase 26 verify passed.")
