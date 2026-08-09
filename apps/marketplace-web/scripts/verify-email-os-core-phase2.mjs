import fs from "node:fs"
import path from "node:path"

const required = [
  "app/api/email-os/provider-test/route.ts",
  "app/api/email-os/sync/route.ts",
  "app/api/email-os/queue/retry/route.ts",
  "database/email-os-core-phase2.sql",
  "components/email-os-core/EmailOSApp.tsx"
]

console.log("\nEMAIL-OS CORE PHASE 2 VERIFY")
console.log("============================")

let failed = false
for (const rel of required) {
  const ok = fs.existsSync(path.join(process.cwd(), rel))
  console.log(`${ok ? "✓" : "✗"} ${rel}`)
  if (!ok) failed = true
}

if (failed) process.exit(1)
console.log("\nEmail-OS core phase 2 verify passed.")
