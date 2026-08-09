import fs from "node:fs"

const required = [
  "app/api/email-os/send/route.ts",
  "app/api/email-os/cron/queue-worker/route.ts",
  "app/api/email-os/outbox/route.ts",
  "app/api/email-os/outbound-messages/route.ts",
  "database/email-os-send-outbox-queue-alignment.sql"
]

console.log("\nEMAIL-OS SEND / OUTBOX / QUEUE ALIGNMENT VERIFY")
console.log("===============================================")

let failed = false

for (const file of required) {
  const ok = fs.existsSync(file)
  console.log(`${ok ? "✓" : "✗"} ${file}`)
  if (!ok) failed = true
}

if (failed) process.exit(1)

console.log("\nAlignment files are present.")
