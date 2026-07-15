import fs from "node:fs"
import path from "node:path"

const required = [
  "lib/email-os-core/realtime/event-bus.ts",
  "lib/email-os-core/security/api-guard.ts",
  "app/api/email-os/realtime/events/route.ts",
  "app/api/email-os/automation/execute/route.ts",
  "components/email-os-core/RealtimeActivityFeed.tsx",
  "components/email-os-core/SecurityStatusPanel.tsx"
]

console.log("\nEMAIL-OS CORE PHASE 8 VERIFY")
console.log("============================")

let failed = false

for (const rel of required) {
  const ok = fs.existsSync(path.join(process.cwd(), rel))
  console.log(`${ok ? "✓" : "✗"} ${rel}`)
  if (!ok) failed = true
}

if (failed) process.exit(1)

console.log("\nEmail-OS core phase 8 verify passed.")
