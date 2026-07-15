import fs from "node:fs"
import path from "node:path"

const required = [
  "database/email-os-core-phase16.sql",
  "lib/email-os-core/default-provider.ts",
  "app/api/email-os/provider-profiles/route.ts",
  "app/api/email-os/mailbox-onboarding/route.ts",
  "app/api/email-os/mailbox-credentials/route.ts",
  "components/email-os-core/ProviderProfilesPanel.tsx",
  "components/email-os-core/MailboxOnboardingPanel.tsx",
  "app/(protected)/email-os/onboarding/page.tsx"
]

console.log("\nEMAIL-OS CORE PHASE 16 VERIFY")
console.log("=============================")

let failed = false
for (const rel of required) {
  const ok = fs.existsSync(path.join(process.cwd(), rel))
  console.log(`${ok ? "✓" : "✗"} ${rel}`)
  if (!ok) failed = true
}
if (failed) process.exit(1)
console.log("\nEmail-OS core phase 16 verify passed.")
