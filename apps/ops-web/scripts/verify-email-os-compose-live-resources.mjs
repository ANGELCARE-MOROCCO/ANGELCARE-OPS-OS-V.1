import fs from "node:fs"

const files = [
  "app/api/email-os/compose-resources/route.ts",
  "app/api/email-os/compose-action/route.ts",
  "components/email-os-core/EnterpriseComposeModal.tsx"
]

let failed = false

console.log("EMAIL-OS COMPOSE LIVE RESOURCES VERIFY")
console.log("=====================================")

for (const file of files) {
  const ok = fs.existsSync(file)
  console.log(`${ok ? "✓" : "✗"} ${file}`)
  if (!ok) failed = true
}

const modal = fs.existsSync(files[2]) ? fs.readFileSync(files[2], "utf8") : ""

for (const marker of [
  "/api/email-os/compose-resources",
  "Live Templates",
  "Send from / Outbox mailbox",
  "applyTemplate",
  "addDriveLink",
  "Email tracking",
  "Request read receipt",
  "/api/email-os/send-direct"
]) {
  const ok = modal.includes(marker)
  console.log(`${ok ? "✓" : "✗"} ${marker}`)
  if (!ok) failed = true
}

if (failed) process.exit(1)

console.log("Ready.")
