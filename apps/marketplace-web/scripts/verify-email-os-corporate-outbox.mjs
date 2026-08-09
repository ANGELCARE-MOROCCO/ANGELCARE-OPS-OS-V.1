import fs from "node:fs"

const required = [
  "components/email-os-core/CorporateOutboxCommandCenter.tsx",
  "app/(protected)/email-os/outbox-real/page.tsx",
  "app/api/email-os/outbox/retry/route.ts"
]

console.log("\nEMAIL-OS CORPORATE OUTBOX VERIFY")
console.log("================================")

let failed = false

for (const file of required) {
  const ok = fs.existsSync(file)
  console.log(`${ok ? "✓" : "✗"} ${file}`)
  if (!ok) failed = true
}

const component = fs.readFileSync("components/email-os-core/CorporateOutboxCommandCenter.tsx", "utf8")
for (const marker of ["Outbox Command Center", "Dispatcher maintenant", "Retry", "Afficher diagnostics techniques", "/api/email-os/dispatch-now", "/api/email-os/outbox/retry"]) {
  const ok = component.includes(marker)
  console.log(`${ok ? "✓" : "✗"} ${marker}`)
  if (!ok) failed = true
}

if (failed) process.exit(1)
console.log("\nCorporate outbox is ready.")
