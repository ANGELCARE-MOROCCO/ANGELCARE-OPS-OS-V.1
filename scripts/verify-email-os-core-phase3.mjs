import fs from "node:fs"
import path from "node:path"

const required = [
  "components/email-os-core/EmailOSWorkspacePro.tsx",
  "components/email-os-core/ProviderActionsPanel.tsx",
  "app/(protected)/email-os/page.tsx",
  "app/api/email-os/thread-action/route.ts",
  "database/email-os-core-phase3.sql"
]

console.log("\nEMAIL-OS CORE PHASE 3 VERIFY")
console.log("============================")

let failed = false
for (const rel of required) {
  const ok = fs.existsSync(path.join(process.cwd(), rel))
  console.log(`${ok ? "✓" : "✗"} ${rel}`)
  if (!ok) failed = true
}

if (failed) process.exit(1)
console.log("\nEmail-OS core phase 3 verify passed.")
