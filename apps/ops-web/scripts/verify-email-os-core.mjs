import fs from "node:fs"
import path from "node:path"

const files = [
  "app/(protected)/email-os/page.tsx",
  "app/api/email-os/health/route.ts",
  "app/api/email-os/send/route.ts",
  "app/api/email-os/entities/[entity]/route.ts",
  "app/api/email-os/entities/[entity]/[id]/route.ts",
  "components/email-os-core/EmailOSApp.tsx",
  "lib/email-os-core/schema.ts",
  "lib/email-os-core/db.ts",
  "lib/email-os-core/map.ts",
  "database/email-os-core.sql"
]

let bad = false
console.log("\nEMAIL-OS CORE VERIFY")
console.log("====================")
for (const f of files) {
  const ok = fs.existsSync(path.join(process.cwd(), f))
  console.log(`${ok ? "✓" : "✗"} ${f}`)
  if (!ok) bad = true
}
if (bad) process.exit(1)
console.log("\nEmail-OS core verify passed.")
