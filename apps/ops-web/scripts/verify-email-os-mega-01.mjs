import fs from "node:fs"
const files = [
  "lib/email-os-ui/client.ts",
  "app/api/email-os/message-action/route.ts",
  "hooks/useEmailOSActionEngine.ts"
]
let failed = false
console.log("EMAIL-OS MEGA 01 VERIFY")
for (const file of files) {
  const ok = fs.existsSync(file)
  console.log(`${ok ? "✓" : "✗"} ${file}`)
  if (!ok) failed = true
}
if (failed) process.exit(1)
