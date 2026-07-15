import fs from "node:fs"

const required = [
  "database/email-os-core-phase27.sql",
  "app/api/email-os/ai/triage/route.ts",
  "app/api/email-os/realtime/events/route.ts",
  "app/api/email-os/security/permissions/seed/route.ts",
  "components/email-os-core/Phase27MegaCenter.tsx",
  "app/(protected)/email-os/mega-operations/page.tsx"
]

console.log("\nEMAIL-OS CORE PHASE 27 VERIFY")
console.log("=============================")

let failed = false

for (const file of required) {
  const ok = fs.existsSync(file)
  console.log(`${ok ? "✓" : "✗"} ${file}`)
  if (!ok) failed = true
}

if (failed) process.exit(1)

console.log("\nPhase 27 verification passed.")
