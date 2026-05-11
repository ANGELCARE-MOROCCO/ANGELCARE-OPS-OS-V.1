import fs from "node:fs"

const required = [
  "app/api/email-os/templates/route.ts",
  "components/email-os-core/ProductionComposeStudio.tsx"
]

console.log("\nEMAIL-OS TEMPLATE → COMPOSE SYNC VERIFY")
console.log("=======================================")

let failed = false

for (const file of required) {
  const ok = fs.existsSync(file)
  console.log(`${ok ? "✓" : "✗"} ${file}`)
  if (!ok) failed = true
}

const compose = fs.readFileSync("components/email-os-core/ProductionComposeStudio.tsx", "utf8")
for (const marker of ["/api/email-os/templates", "applyTemplate", "setSubject", "setBody", "filteredTemplates"]) {
  const ok = compose.includes(marker)
  console.log(`${ok ? "✓" : "✗"} compose contains ${marker}`)
  if (!ok) failed = true
}

if (failed) process.exit(1)
console.log("\nTemplate compose sync is present.")
