import fs from "node:fs"

const files = [
  "database/email-os-core-phase25.sql",
  "app/api/email-os/executive/escalations/route.ts",
  "app/api/email-os/executive/run-escalation-engine/route.ts",
  "components/email-os-core/ExecutiveAutomationPanel.tsx",
  "app/(protected)/email-os/executive-automation/page.tsx"
]

console.log("\nEMAIL-OS CORE PHASE 25 VERIFY")
console.log("==============================")

let failed = false

for (const file of files) {
  const ok = fs.existsSync(file)
  console.log(`${ok ? "✓" : "✗"} ${file}`)
  if (!ok) failed = true
}

if (failed) process.exit(1)

console.log("\nPhase 25 verification passed.")
