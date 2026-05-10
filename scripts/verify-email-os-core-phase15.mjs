import fs from "node:fs"
import path from "node:path"

const required = [
  "app/api/email-os/launch-readiness/route.ts",
  "app/(protected)/email-os/launch-ops/page.tsx",
  "scripts/email-os-core-env-scan.mjs",
  "scripts/email-os-core-endpoint-check.mjs"
]

console.log("\nEMAIL-OS CORE PHASE 15 VERIFY")
console.log("=============================")

let failed = false

for (const rel of required) {
  const ok = fs.existsSync(path.join(process.cwd(), rel))
  console.log(`${ok ? "✓" : "✗"} ${rel}`)
  if (!ok) failed = true
}

if (failed) process.exit(1)

console.log("\nEmail-OS core phase 15 verify passed.")
