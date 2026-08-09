import fs from "node:fs"

const required = [
  "components/email-os-core/RealInboxWorkspace.tsx",
  "app/api/email-os/inbox/route.ts",
  "app/api/email-os/sync/route.ts",
  "docs/PATCH_EMAIL_OS_WORKSPACE_PRO.md"
]

console.log("\nEMAIL-OS REAL INBOX SYNC VERIFY")
console.log("===============================")

let failed = false

for (const file of required) {
  const ok = fs.existsSync(file)
  console.log(`${ok ? "✓" : "✗"} ${file}`)
  if (!ok) failed = true
}

if (failed) process.exit(1)
console.log("\nReal inbox sync files are present.")
