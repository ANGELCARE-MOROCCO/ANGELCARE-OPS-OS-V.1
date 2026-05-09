import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const checks = [
  "lib/email-os/click-actions/action-types.ts",
  "lib/email-os/click-actions/action-client.ts",
  "lib/email-os/click-actions/use-action-runner.ts",
  "components/email-os/click-actions/ActionToast.tsx",
  "app/api/email-os/actions/execute/route.ts",
  "components/email-os/v12/EmailOSV12Shell.tsx",
  "database/email-os/email-os-click-execution-safety.sql"
]

console.log("\nEMAIL-OS CLICK EXECUTION QA")
console.log("==========================")

let failed = false
for (const rel of checks) {
  const exists = fs.existsSync(path.join(root, rel))
  console.log(`${exists ? "✓" : "✗"} ${rel}`)
  if (!exists) failed = true
}

if (failed) {
  console.error("\nClick execution QA failed.")
  process.exit(1)
}

console.log("\nClick execution QA passed.")
