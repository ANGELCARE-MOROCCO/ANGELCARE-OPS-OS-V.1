import fs from "node:fs"

const checks = [
  "lib/email-os-ui/client.ts",
  "app/api/email-os/message-action/route.ts",
  "hooks/useEmailOSActionEngine.ts",
  "components/email-os-core/EnterpriseComposeModal.tsx",
  "components/email-os-core/InboxActionToolbar.tsx",
  "components/email-os-core/AIAssistantActionPanel.tsx",
  "app/api/email-os/operations-action/route.ts",
  "app/api/email-os/send-direct/route.ts"
]

console.log("EMAIL-OS ALL MEGA VERIFY")
let failed = false

for (const file of checks) {
  const ok = fs.existsSync(file)
  console.log(`${ok ? "✓" : "✗"} ${file}`)
  if (!ok) failed = true
}

if (failed) {
  console.log("\\nMissing files. Inject all mega zips before build.")
  process.exit(1)
}

console.log("\\nAll mega pack files are present.")
