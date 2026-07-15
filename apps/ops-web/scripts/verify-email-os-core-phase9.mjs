import fs from "node:fs"
import path from "node:path"

const required = [
  "app/api/email-os/export/[entity]/route.ts",
  "app/api/email-os/backup-manifest/route.ts",
  "app/api/email-os/provider-readiness/route.ts",
  "components/email-os-core/OpsReportPanel.tsx",
  "app/(protected)/email-os/deployment-readiness/page.tsx",
  "scripts/email-os-core-smoke.mjs"
]

console.log("\nEMAIL-OS CORE PHASE 9 VERIFY")
console.log("============================")

let failed = false

for (const rel of required) {
  const ok = fs.existsSync(path.join(process.cwd(), rel))
  console.log(`${ok ? "✓" : "✗"} ${rel}`)
  if (!ok) failed = true
}

if (failed) process.exit(1)

console.log("\nEmail-OS core phase 9 verify passed.")
