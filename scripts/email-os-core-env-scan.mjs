import fs from "node:fs"

if (fs.existsSync(".env.local")) {
  const lines = fs.readFileSync(".env.local", "utf8").split(/\r?\n/)
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const index = trimmed.indexOf("=")
    if (index === -1) continue
    const key = trimmed.slice(0, index).trim()
    const value = trimmed.slice(index + 1).trim()
    if (!process.env[key]) process.env[key] = value
  }
}

const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY"
]

const optional = [
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "EMAIL_OS_SMTP_HOST",
  "EMAIL_OS_SMTP_PORT",
  "EMAIL_OS_SMTP_USER",
  "EMAIL_OS_SMTP_PASSWORD",
  "EMAIL_OS_SMTP_FROM",
  "EMAIL_OS_IMAP_HOST",
  "EMAIL_OS_IMAP_PORT",
  "EMAIL_OS_IMAP_USER",
  "EMAIL_OS_IMAP_PASSWORD",
  "EMAIL_OS_CRON_SECRET",
  "EMAIL_OS_INTERNAL_TOKEN"
]

console.log("\nEMAIL-OS ENV SCAN")
console.log("=================")

let failed = false

for (const key of required) {
  const ok = Boolean(process.env[key])
  console.log(`${ok ? "✓" : "✗"} ${key}`)
  if (!ok) failed = true
}

for (const key of optional) {
  const ok = Boolean(process.env[key])
  console.log(`${ok ? "✓" : "!"} ${key}`)
}

if (failed) {
  console.error("\nMissing required Email-OS env vars.")
  process.exit(1)
}

console.log("\nEmail-OS required env vars are present.")
