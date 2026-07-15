import fs from "node:fs"
import path from "node:path"

const required = [
  "database/email-os-core-phase14.sql",
  "app/api/email-os/access/permissions/route.ts",
  "app/api/email-os/access/profiles/route.ts",
  "app/api/email-os/access/check/route.ts",
  "app/api/email-os/access/audit/route.ts",
  "components/email-os-core/PermissionsPanel.tsx",
  "app/(protected)/email-os/permissions/page.tsx"
]

console.log("\nEMAIL-OS CORE PHASE 14 VERIFY")
console.log("=============================")

let failed = false

for (const rel of required) {
  const ok = fs.existsSync(path.join(process.cwd(), rel))
  console.log(`${ok ? "✓" : "✗"} ${rel}`)
  if (!ok) failed = true
}

if (failed) process.exit(1)

console.log("\nEmail-OS core phase 14 verify passed.")
