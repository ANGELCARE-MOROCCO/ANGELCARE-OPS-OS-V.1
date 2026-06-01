import fs from "node:fs"

const files = [
  "lib/email-os-core/mailbox-credentials.ts",
  "lib/email-os-core/ceo-access.ts",
  "app/api/email-os/mailbox-liveness/route.ts",
  "app/api/email-os/mailbox-liveness/probe/route.ts",
  "components/email-os-core/CEOMailboxLivenessMonitor.tsx",
  "components/email-os-core/CEOSettingsMailboxMonitorButton.tsx",
  "app/(protected)/email-os/mailbox-liveness/page.tsx",
  "docs/WIRE_CEO_MAILBOX_MONITOR_BUTTON.md"
]
let failed = false
console.log("EMAIL-OS CEO MAILBOX LIVENESS VERIFY")
for (const file of files) {
  const ok = fs.existsSync(file)
  console.log(`${ok ? "✓" : "✗"} ${file}`)
  if (!ok) failed = true
}
const page = fs.existsSync("components/email-os-core/CEOMailboxLivenessMonitor.tsx") ? fs.readFileSync("components/email-os-core/CEOMailboxLivenessMonitor.tsx", "utf8") : ""
for (const marker of ["Email-OS Mailbox Liveness Command", "/api/email-os/mailbox-liveness", "Run deep probe", "SMTP Outgoing", "IMAP Incoming"]) {
  const ok = page.includes(marker)
  console.log(`${ok ? "✓" : "✗"} ${marker}`)
  if (!ok) failed = true
}
if (failed) process.exit(1)
console.log("Ready.")
