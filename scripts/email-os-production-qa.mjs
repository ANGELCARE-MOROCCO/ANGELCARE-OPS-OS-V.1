
import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const checks = [
  "lib/email-os/production/types.ts",
  "lib/email-os/production/env.ts",
  "lib/email-os/production/rbac.ts",
  "lib/email-os/production/audit.ts",
  "lib/email-os/production/queue.ts",
  "lib/email-os/production/approvals.ts",
  "lib/email-os/production/sla.ts",
  "lib/email-os/production/notifications.ts",
  "lib/email-os/production/smtp-service.ts",
  "lib/email-os/production/imap-service.ts",
  "app/api/email-os/production/health/route.ts",
  "app/api/email-os/production/send/route.ts",
  "app/api/email-os/production/queue/route.ts",
  "app/api/email-os/production/cron/queue-worker/route.ts",
  "app/(protected)/email-os/production-readiness/page.tsx"
]

console.log("\nEMAIL-OS PRODUCTION QA")
console.log("======================")

let failed = false
for (const rel of checks) {
  const ok = fs.existsSync(path.join(root, rel))
  console.log(`${ok ? "✓" : "✗"} ${rel}`)
  if (!ok) failed = true
}

if (failed) {
  console.error("\nProduction QA failed.")
  process.exit(1)
}

console.log("\nProduction QA passed.")
