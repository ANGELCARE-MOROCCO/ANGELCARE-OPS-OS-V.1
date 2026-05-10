import fs from "node:fs"
import path from "node:path"

const required = [
  "database/email-os-core-phase24.sql",
  "app/api/email-os/intelligence/priority-score/route.ts",
  "app/api/email-os/intelligence/risk-classify/route.ts",
  "app/api/email-os/intelligence/bottlenecks/route.ts",
  "app/api/email-os/command-center/summary/route.ts",
  "components/email-os-core/CommandCenterIntelligencePanel.tsx",
  "app/(protected)/email-os/command-center/page.tsx"
]

console.log("\nEMAIL-OS CORE PHASE 24 VERIFY")
console.log("=============================")

let failed = false
for (const rel of required) {
  const ok = fs.existsSync(path.join(process.cwd(), rel))
  console.log(`${ok ? "✓" : "✗"} ${rel}`)
  if (!ok) failed = true
}
if (failed) process.exit(1)
console.log("\nEmail-OS core phase 24 verify passed.")
