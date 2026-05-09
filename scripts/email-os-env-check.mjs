
const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY"
]

const live = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "EMAIL_OS_SMTP_HOST",
  "EMAIL_OS_SMTP_PORT",
  "EMAIL_OS_SMTP_USER",
  "EMAIL_OS_SMTP_PASSWORD",
  "EMAIL_OS_IMAP_HOST",
  "EMAIL_OS_IMAP_PORT",
  "EMAIL_OS_IMAP_USER",
  "EMAIL_OS_IMAP_PASSWORD",
  "EMAIL_OS_CRON_SECRET",
  "EMAIL_OS_ENCRYPTION_KEY"
]

const missingRequired = required.filter((k) => !process.env[k])
const missingLive = live.filter((k) => !process.env[k])

console.log("\nEMAIL-OS ENV CHECK")
console.log("==================")
console.log("Required missing:", missingRequired.length ? missingRequired : "none")
console.log("Live provider missing:", missingLive.length ? missingLive : "none")

if (missingRequired.length) {
  console.error("\nRequired env missing.")
  process.exit(1)
}

console.log("\nBase env passed. Live provider env may still be needed for full production.")
