import fs from "node:fs"

const files = [
  "lib/email-os-core/multi-mailbox-resolver.ts",
  "app/api/email-os/send-direct/route.ts",
  "app/api/email-os/compose-resources/route.ts"
]

let failed = false

console.log("EMAIL-OS MULTI MAILBOX SMTP RESOLVER VERIFY")
console.log("==========================================")

for (const file of files) {
  const ok = fs.existsSync(file)
  console.log(`${ok ? "✓" : "✗"} ${file}`)
  if (!ok) failed = true
}

const resolver = fs.existsSync(files[0]) ? fs.readFileSync(files[0], "utf8") : ""
const send = fs.existsSync(files[1]) ? fs.readFileSync(files[1], "utf8") : ""

for (const marker of [
  "GLOBAL_SMTP_HOST",
  "SUPPORTS",
  "resolveEmailOSMailboxIdentity",
  "send_direct_multi_mailbox",
  "SMTP is not configured",
  "mailboxIdFromEmail"
]) {
  const ok = (resolver + send).includes(marker)
  console.log(`${ok ? "✓" : "✗"} ${marker}`)
  if (!ok) failed = true
}

if (failed) process.exit(1)

console.log("Ready.")
