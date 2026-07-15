import fs from "node:fs"
import path from "node:path"

const required = [
  "database/email-os-core-phase22.sql",
  "app/api/email-os/sla/evaluate/route.ts",
  "app/api/email-os/workflows/escalate/route.ts",
  "components/email-os-core/SLAWorkflowPanel.tsx",
  "app/(protected)/email-os/sla-workflows/page.tsx"
]

console.log("\nEMAIL-OS CORE PHASE 22 VERIFY")
console.log("=============================")

let failed = false

for (const rel of required) {
  const ok = fs.existsSync(path.join(process.cwd(), rel))
  console.log(`${ok ? "✓" : "✗"} ${rel}`)
  if (!ok) failed = true
}

if (failed) process.exit(1)

console.log("\nEmail-OS core phase 22 verify passed.")
