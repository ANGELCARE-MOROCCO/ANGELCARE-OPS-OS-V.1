import fs from "node:fs"

const file = "components/email-os-core/ProductionComposeStudio.tsx"

console.log("\nEMAIL-OS CORPORATE COMPOSE UX VERIFY")
console.log("====================================")

if (!fs.existsSync(file)) {
  console.log("✗ Missing ProductionComposeStudio.tsx")
  process.exit(1)
}

const text = fs.readFileSync(file, "utf8")
const markers = [
  "Compose Command Center",
  "successOpen",
  "lifecycle",
  "resetCompose",
  "Email ajouté à l’outbox",
  "Envoyer vers Outbox",
  "Execution Control"
]

let failed = false
for (const marker of markers) {
  const ok = text.includes(marker)
  console.log(`${ok ? "✓" : "✗"} ${marker}`)
  if (!ok) failed = true
}

if (failed) process.exit(1)
console.log("\nCorporate compose UX is present.")
