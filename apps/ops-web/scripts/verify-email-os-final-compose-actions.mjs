import fs from "node:fs"

const files = [
  "components/email-os-core/EnterpriseComposeModal.tsx",
  "components/email-os-core/InboxActionToolbar.tsx",
  "hooks/useEmailOSActionEngine.ts",
  "app/api/email-os/message-action/route.ts"
]

console.log("EMAIL-OS FINAL COMPOSE + ACTIONS VERIFY")
console.log("======================================")
let failed = false
for (const file of files) {
  const ok = fs.existsSync(file)
  console.log(`${ok ? "✓" : "✗"} ${file}`)
  if (!ok) failed = true
}

const compose = fs.readFileSync("components/email-os-core/EnterpriseComposeModal.tsx", "utf8")
for (const marker of ["Nouveau message", "Assistant de rédaction", "Paramètres de livraison", "Documents", "/api/email-os/send-direct"]) {
  const ok = compose.includes(marker)
  console.log(`${ok ? "✓" : "✗"} ${marker}`)
  if (!ok) failed = true
}
if (failed) process.exit(1)
console.log("\nFinal compose/action pack is present.")
