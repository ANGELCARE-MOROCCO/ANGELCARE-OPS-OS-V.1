import fs from "node:fs"
import path from "node:path"

const required = [
  "database/email-os-core-phase20.sql",
  "app/api/email-os/search/route.ts",
  "app/api/email-os/search/index/route.ts",
  "app/api/email-os/saved-searches/route.ts",
  "components/email-os-core/SearchOperationsPanel.tsx",
  "app/(protected)/email-os/search/page.tsx"
]

console.log("\nEMAIL-OS CORE PHASE 20 VERIFY")
console.log("=============================")

let failed = false
for (const rel of required) {
  const ok = fs.existsSync(path.join(process.cwd(), rel))
  console.log(`${ok ? "✓" : "✗"} ${rel}`)
  if (!ok) failed = true
}
if (failed) process.exit(1)
console.log("\nEmail-OS core phase 20 verify passed.")
