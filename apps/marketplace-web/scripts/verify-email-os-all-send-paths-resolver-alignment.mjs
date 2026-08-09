import fs from "node:fs"

const files = [
  "lib/email-os-core/send-mail.ts",
  "app/api/email-os/send-direct/route.ts",
  "app/api/email-os/cron/queue-worker/route.ts",
  "scripts/audit-email-os-send-paths.mjs"
]

let failed = false

console.log("EMAIL-OS ALL SEND PATHS RESOLVER ALIGNMENT VERIFY")
console.log("=================================================")

for (const file of files) {
  const ok = fs.existsSync(file)
  console.log(`${ok ? "✓" : "✗"} ${file}`)
  if (!ok) failed = true
}

const all = files.filter((file) => fs.existsSync(file)).map((file) => fs.readFileSync(file, "utf8")).join("\n")

for (const marker of [
  "sendEmailOSDirect",
  "resolveEmailOSMailboxIdentity",
  "central-send-mail",
  "send_direct_central_resolver",
  "audit-email-os-send-paths",
  "nodemailer.createTransport"
]) {
  const ok = all.includes(marker)
  console.log(`${ok ? "✓" : "✗"} ${marker}`)
  if (!ok) failed = true
}

if (failed) process.exit(1)

console.log("Ready.")
