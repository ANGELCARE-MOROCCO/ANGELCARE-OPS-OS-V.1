import fs from "node:fs"

const files = [
  "app/api/email-os/send-direct/route.ts",
  "scripts/audit-email-os-send-paths.mjs"
]

let failed = false

console.log("EMAIL-OS FINAL AUDIT FALSE POSITIVE FIX VERIFY")
console.log("=============================================")

for (const file of files) {
  const ok = fs.existsSync(file)
  console.log(`${ok ? "✓" : "✗"} ${file}`)
  if (!ok) failed = true
}

const sendDirect = fs.existsSync(files[0]) ? fs.readFileSync(files[0], "utf8") : ""

for (const marker of [
  "sendEmailOSDirect",
  "central-send-mail",
  "send_direct_central_resolver"
]) {
  const ok = sendDirect.includes(marker)
  console.log(`${ok ? "✓" : "✗"} ${marker}`)
  if (!ok) failed = true
}

for (const stale of [
  "EMAIL_OS_SMTP_USER",
  "EMAIL_OS_SMTP_PASSWORD",
  "EMAIL_OS_SMTP_FROM"
]) {
  const ok = !sendDirect.includes(stale)
  console.log(`${ok ? "✓" : "✗"} send-direct no ${stale}`)
  if (!ok) failed = true
}

if (failed) process.exit(1)
console.log("Ready.")
