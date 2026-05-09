
import fs from "node:fs"
import path from "node:path"

const root = process.cwd()

const checks = [
  "lib/email-os/runtime/auth-context.ts",
  "lib/email-os/runtime/mailbox-guard.ts",
  "lib/email-os/runtime/repositories.ts",
  "lib/email-os/runtime/queue-processor.ts",
  "lib/email-os/runtime/sla-sweep.ts",
  "lib/email-os/runtime/realtime-client.ts",
  "app/api/email-os/runtime/queue-worker/route.ts",
  "app/api/email-os/runtime/sla-sweep/route.ts",
  "app/api/email-os/runtime/events/route.ts",
  "app/api/email-os/runtime/mailbox-access/route.ts",
  "app/(protected)/email-os/runtime/page.tsx",
  "database/email-os/email-os-runtime-maturity.sql"
]

console.log("\nEMAIL-OS RUNTIME MATURITY QA")
console.log("============================")

let failed = false
for (const rel of checks) {
  const ok = fs.existsSync(path.join(root, rel))
  console.log(`${ok ? "✓" : "✗"} ${rel}`)
  if (!ok) failed = true
}

if (failed) {
  console.error("\nRuntime maturity QA failed.")
  process.exit(1)
}

console.log("\nRuntime maturity QA passed.")
