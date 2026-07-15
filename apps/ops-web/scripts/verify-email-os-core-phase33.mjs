import fs from "node:fs"

const required = [
  "database/email-os-core-phase33-bulk-mailbox-preinstall.sql",
  "app/api/email-os/mailboxes/bulk-preinstall/route.ts",
  "components/email-os-core/BulkMailboxPreinstallPanel.tsx",
  "app/(protected)/email-os/bulk-mailbox-preinstall/page.tsx"
]

console.log("\nEMAIL-OS CORE PHASE 33 VERIFY")
console.log("=============================")

let failed = false
for (const file of required) {
  const ok = fs.existsSync(file)
  console.log(`${ok ? "✓" : "✗"} ${file}`)
  if (!ok) failed = true
}

if (failed) process.exit(1)

console.log("\nPhase 33 bulk mailbox preinstall verification passed.")
