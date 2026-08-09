import fs from "node:fs"
const files = ["components/email-os-core/InboxActionToolbar.tsx", "docs/PATCH_WORKSPACE_TOOLBAR_ACTIONS.md"]
console.log("EMAIL-OS MEGA 03 VERIFY")
let failed = false
for (const file of files) {
  const ok = fs.existsSync(file)
  console.log(`${ok ? "✓" : "✗"} ${file}`)
  if (!ok) failed = true
}
if (failed) process.exit(1)
