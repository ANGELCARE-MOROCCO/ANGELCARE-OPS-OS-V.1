import fs from "node:fs"
import path from "node:path"

const required = [
  "database/email-os-core-phase17.sql",
  "app/api/email-os/provider-profiles/test/route.ts",
  "app/api/email-os/mailbox-credentials/test/route.ts",
  "app/api/email-os/credential-tests/route.ts",
  "components/email-os-core/MailboxTestingPanel.tsx",
  "app/(protected)/email-os/mailbox-testing/page.tsx"
]

console.log("\nEMAIL-OS CORE PHASE 17 VERIFY")
console.log("=============================")

let failed = false
for (const rel of required) {
  const ok = fs.existsSync(path.join(process.cwd(), rel))
  console.log(`${ok ? "✓" : "✗"} ${rel}`)
  if (!ok) failed = true
}
if (failed) process.exit(1)
console.log("\nEmail-OS core phase 17 verify passed.")
