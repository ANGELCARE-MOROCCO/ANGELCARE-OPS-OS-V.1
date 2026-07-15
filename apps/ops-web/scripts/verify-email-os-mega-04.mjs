import fs from "node:fs"
const files = ["components/email-os-core/AIAssistantActionPanel.tsx", "app/api/email-os/operations-action/route.ts"]
console.log("EMAIL-OS MEGA 04 VERIFY")
let failed = false
for (const file of files) {
  const ok = fs.existsSync(file)
  console.log(`${ok ? "✓" : "✗"} ${file}`)
  if (!ok) failed = true
}
if (failed) process.exit(1)
