import fs from "node:fs"
import path from "node:path"

const required = [
  "lib/email-os-core/api-response.ts",
  "lib/email-os-core/validation.ts",
  "lib/email-os-core/rate-limit.ts",
  "lib/email-os-core/role-guard.ts",
  "components/email-os-core/EmailOSErrorBoundary.tsx",
  "app/(protected)/email-os/page.tsx",
  "app/(protected)/email-os/production-checklist/page.tsx",
  "app/api/email-os/diagnostics/route.ts",
  "app/api/email-os/validated-send/route.ts"
]

console.log("\nEMAIL-OS CORE PHASE 5 VERIFY")
console.log("============================")
let failed = false
for (const rel of required) {
  const ok = fs.existsSync(path.join(process.cwd(), rel))
  console.log(`${ok ? "✓" : "✗"} ${rel}`)
  if (!ok) failed = true
}
if (failed) process.exit(1)
console.log("\nEmail-OS core phase 5 verify passed.")
