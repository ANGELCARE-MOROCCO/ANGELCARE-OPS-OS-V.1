
import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const requiredPaths = [
  "components/email-os/v12",
  "app/api/email-os",
  "lib/email-os",
  "app/(protected)/email-os"
]

const requiredEnv = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY"
]

const optionalEnv = [
  "EMAIL_OS_SMTP_HOST",
  "EMAIL_OS_SMTP_USER",
  "EMAIL_OS_SMTP_PASSWORD",
  "EMAIL_OS_IMAP_HOST",
  "EMAIL_OS_IMAP_USER",
  "EMAIL_OS_IMAP_PASSWORD",
  "EMAIL_OS_CRON_SECRET",
  "EMAIL_OS_ENCRYPTION_KEY"
]

const missingPaths = requiredPaths.filter((p) => !fs.existsSync(path.join(root, p)))
const missingRequiredEnv = requiredEnv.filter((key) => !process.env[key])
const missingOptionalEnv = optionalEnv.filter((key) => !process.env[key])

console.log("\nEMAIL-OS PRODUCTION VERIFY")
console.log("==========================")
console.log("Missing paths:", missingPaths.length ? missingPaths : "none")
console.log("Missing required env:", missingRequiredEnv.length ? missingRequiredEnv : "none")
console.log("Missing optional email env:", missingOptionalEnv.length ? missingOptionalEnv : "none")

if (missingPaths.length || missingRequiredEnv.length) {
  console.error("\nEmail-OS verification failed.")
  process.exit(1)
}

console.log("\nEmail-OS verification passed. Optional provider env may still be needed for live SMTP/IMAP.")
