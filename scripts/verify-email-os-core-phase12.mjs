import fs from "node:fs"
import path from "node:path"

const required = [
  "database/email-os-core-phase12.sql",
  "lib/email-os-core/provider-log.ts",
  "app/api/email-os/attachments/route.ts",
  "app/api/email-os/provider-logs/route.ts",
  "app/api/email-os/cron/queue-worker/route.ts",
  "components/email-os-core/ProviderObservabilityPanel.tsx",
  "components/email-os-core/AttachmentManager.tsx"
]

console.log("\nEMAIL-OS CORE PHASE 12 VERIFY")
console.log("=============================")

let failed = false

for (const rel of required) {
  const ok = fs.existsSync(path.join(process.cwd(), rel))
  console.log(`${ok ? "✓" : "✗"} ${rel}`)
  if (!ok) failed = true
}

if (failed) process.exit(1)

console.log("\nEmail-OS core phase 12 verify passed.")
