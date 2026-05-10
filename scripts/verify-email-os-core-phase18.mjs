import fs from "node:fs"
import path from "node:path"

const required = [
  "database/email-os-core-phase18.sql",
  "app/api/email-os/security/vault-refs/route.ts",
  "app/api/email-os/security/credential-rotations/route.ts",
  "app/api/email-os/security/credential-rotations/[id]/complete/route.ts",
  "app/api/email-os/provider-failover-groups/route.ts",
  "app/api/email-os/mailbox-lifecycle/route.ts",
  "components/email-os-core/CredentialSecurityPanel.tsx",
  "app/(protected)/email-os/credential-security/page.tsx"
]

console.log("\nEMAIL-OS CORE PHASE 18 VERIFY")
console.log("=============================")

let failed = false
for (const rel of required) {
  const ok = fs.existsSync(path.join(process.cwd(), rel))
  console.log(`${ok ? "✓" : "✗"} ${rel}`)
  if (!ok) failed = true
}
if (failed) process.exit(1)
console.log("\nEmail-OS core phase 18 verify passed.")
