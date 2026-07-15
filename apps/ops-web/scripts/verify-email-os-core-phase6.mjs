import fs from "node:fs"
import path from "node:path"

const required = [
  "database/email-os-core-phase6.sql",
  "app/api/email-os/comments/route.ts",
  "app/api/email-os/ai-assist/route.ts",
  "app/api/email-os/activity/route.ts",
  "components/email-os-core/AIAssistantDock.tsx",
  "components/email-os-core/NotificationCenter.tsx"
]

console.log("\nEMAIL-OS CORE PHASE 6 VERIFY")
console.log("============================")

let failed = false

for (const rel of required) {
  const ok = fs.existsSync(path.join(process.cwd(), rel))
  console.log(`${ok ? "✓" : "✗"} ${rel}`)
  if (!ok) failed = true
}

if (failed) process.exit(1)

console.log("\nEmail-OS core phase 6 verify passed.")
