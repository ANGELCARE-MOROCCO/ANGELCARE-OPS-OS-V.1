import fs from "node:fs"
import path from "node:path"

const required = [
  "database/email-os-core-phase23.sql",
  "app/api/email-os/collaboration/assignment-queues/route.ts",
  "app/api/email-os/collaboration/workloads/route.ts",
  "app/api/email-os/collaboration/thread-locks/route.ts",
  "app/api/email-os/collaboration/thread-locks/release/route.ts",
  "app/api/email-os/collaboration/presence/route.ts",
  "app/api/email-os/collaboration/transfer-ownership/route.ts",
  "components/email-os-core/TeamCollaborationPanel.tsx",
  "app/(protected)/email-os/team-collaboration/page.tsx"
]

console.log("\nEMAIL-OS CORE PHASE 23 VERIFY")
console.log("=============================")

let failed = false
for (const rel of required) {
  const ok = fs.existsSync(path.join(process.cwd(), rel))
  console.log(`${ok ? "✓" : "✗"} ${rel}`)
  if (!ok) failed = true
}
if (failed) process.exit(1)
console.log("\nEmail-OS core phase 23 verify passed.")
