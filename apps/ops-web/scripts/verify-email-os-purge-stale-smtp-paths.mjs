import fs from "node:fs"

const files = [
  "lib/smtp.ts",
  "app/api/email-os/compose/send/route.ts",
  "app/api/email-os/send/route.ts",
  "app/api/email-os/compose/draft/route.ts",
  "app/api/email-os/queue/retry/route.ts",
  "app/api/email-os/compose/diagnostics/route.ts",
  "app/api/email-os/health/route.ts",
  "app/api/email-os/launch-readiness/route.ts",
  "app/api/email-os/production/provider-validation/route.ts",
  "app/api/email-os/provider-readiness/route.ts",
  "app/api/email-os/provider-test/route.ts",
  "app/api/email-os/provider-test/test/route.ts",
  "app/api/email-os/mailbox-credentials/test/route.ts",
  "app/api/email-os/mailbox-liveness/probe/route.ts",
  "app/api/email-os/sync/route.ts",
  "scripts/audit-email-os-send-paths.mjs"
]

let failed = false
console.log("EMAIL-OS PURGE STALE SMTP PATHS VERIFY")
console.log("=====================================")

for (const file of files) {
  const ok = fs.existsSync(file)
  console.log(`${ok ? "✓" : "✗"} ${file}`)
  if (!ok) failed = true
}

if (failed) process.exit(1)
console.log("Ready.")
