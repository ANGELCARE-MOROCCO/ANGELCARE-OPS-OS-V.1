import fs from "node:fs"

const required = [
  "database/email-os-core-phase32-compose-outbox.sql",
  "lib/email-os-core/mailbox-display.ts",
  "app/api/email-os/compose/send/route.ts",
  "app/api/email-os/compose/draft/route.ts",
  "app/api/email-os/outbound-messages/route.ts",
  "app/api/email-os/saved-drafts/route.ts",
  "components/email-os-core/RealComposeStudio.tsx",
  "components/email-os-core/RealOutboxQueue.tsx",
  "app/(protected)/email-os/compose-real/page.tsx",
  "app/(protected)/email-os/outbox-real/page.tsx"
]

console.log("\nEMAIL-OS CORE PHASE 32 VERIFY")
console.log("=============================")

let failed = false
for (const file of required) {
  const ok = fs.existsSync(file)
  console.log(`${ok ? "✓" : "✗"} ${file}`)
  if (!ok) failed = true
}

if (failed) process.exit(1)
console.log("\nPhase 32 compose/outbox repair verification passed.")
