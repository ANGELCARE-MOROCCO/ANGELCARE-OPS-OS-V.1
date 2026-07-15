import fs from "node:fs"

const file = "components/email-os-core/RealInboxWorkspace.tsx"

console.log("\nEMAIL-OS ENTERPRISE INBOX VERIFY")
console.log("================================")

if (!fs.existsSync(file)) {
  console.log("✗ Missing RealInboxWorkspace.tsx")
  process.exit(1)
}

const text = fs.readFileSync(file, "utf8")
const markers = ["Enterprise Inbox Command Center", "Mailbox Control", "Sync 13 boîtes", "Vue active", "Toutes les boîtes", "Diagnostics techniques"]

let failed = false
for (const marker of markers) {
  const ok = text.includes(marker)
  console.log(`${ok ? "✓" : "✗"} ${marker}`)
  if (!ok) failed = true
}

if (failed) process.exit(1)
console.log("\nEnterprise inbox is ready.")
