import fs from "node:fs"

const required = [
  "components/email-os-core/ProductionComposeStudio.tsx",
  "lib/email-os-core/compose-templates.ts",
  "app/api/email-os/compose/ai-assist/route.ts",
  "app/api/email-os/compose/diagnostics/route.ts",
  "app/api/email-os/compose/attachments/route.ts",
  "app/(protected)/email-os/compose/page.tsx",
  "app/(protected)/email-os/compose-production/page.tsx",
  "database/email-os-compose-production-upgrade.sql"
]

console.log("\nEMAIL-OS COMPOSE PRODUCTION VERIFY")
console.log("==================================")

let failed = false

for (const file of required) {
  const ok = fs.existsSync(file)
  console.log(`${ok ? "✓" : "✗"} ${file}`)
  if (!ok) failed = true
}

if (failed) process.exit(1)

console.log("\nCompose production files are present.")
