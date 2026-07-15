import fs from "node:fs"

const file = "components/email-os-core/EmailOSWorkspacePro.tsx"

console.log("\nEMAIL-OS ACTIONABLE WORKSPACE VERIFY")
console.log("===================================")

if (!fs.existsSync(file)) {
  console.log("✗ Missing EmailOSWorkspacePro.tsx")
  process.exit(1)
}

const text = fs.readFileSync(file, "utf8")
const markers = [
  "Schedule Email",
  "Enterprise Compose",
  "Reply Command Center",
  "Schedule Meeting / Call / Action",
  "Create Follow-up Task",
  "Add to CRM",
  "Smart search emails",
  "/api/email-os/send-direct",
  "/api/email-os/entities/audit"
]

let failed = false

for (const marker of markers) {
  const ok = text.includes(marker)
  console.log(`${ok ? "✓" : "✗"} ${marker}`)
  if (!ok) failed = true
}

if (failed) process.exit(1)
console.log("\nActionable enterprise Email-OS workspace is present.")
