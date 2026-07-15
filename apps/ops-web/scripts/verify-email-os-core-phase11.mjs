import fs from "node:fs"
import path from "node:path"

const required = [
  "database/email-os-core-phase11.sql",
  "app/api/email-os/saved-views/route.ts",
  "app/api/email-os/bulk/thread-action/route.ts",
  "components/email-os-core/CommandPalette.tsx",
  "components/email-os-core/SavedViewsPanel.tsx",
  "components/email-os-core/BulkActionsBar.tsx"
]

console.log("\nEMAIL-OS CORE PHASE 11 VERIFY")
console.log("=============================")

let failed = false

for (const rel of required) {
  const ok = fs.existsSync(path.join(process.cwd(), rel))
  console.log(`${ok ? "✓" : "✗"} ${rel}`)
  if (!ok) failed = true
}

if (failed) process.exit(1)

console.log("\nEmail-OS core phase 11 verify passed.")
