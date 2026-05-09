import fs from "node:fs"
import path from "node:path"

const root = process.cwd()

const checks = [
  "lib/email-os/final/final-response.ts",
  "lib/email-os/final/final-db.ts",
  "lib/email-os/final/final-normalizers.ts",
  "lib/email-os/final/final-audit.ts",
  "lib/email-os/final/final-queue.ts",
  "app/api/email-os/live/threads/route.ts",
  "app/api/email-os/live/mailboxes/route.ts",
  "app/api/email-os/live/templates/route.ts",
  "app/api/email-os/live/drafts/route.ts",
  "app/api/email-os/live/thread-action/route.ts",
  "app/api/email-os/live/send-or-queue/route.ts",
  "app/api/email-os/live/approval-execute/route.ts",
  "lib/email-os/final/use-final-compose.ts",
  "lib/email-os/final/use-final-thread-actions.ts",
  "database/email-os/email-os-final-execution.sql"
]

console.log("\nEMAIL-OS FINAL PRODUCTION EXECUTION QA")
console.log("======================================")

let failed = false
for (const rel of checks) {
  const ok = fs.existsSync(path.join(root, rel))
  console.log(`${ok ? "✓" : "✗"} ${rel}`)
  if (!ok) failed = true
}

if (failed) {
  console.error("\nFinal production execution QA failed.")
  process.exit(1)
}

console.log("\nFinal production execution QA passed.")
