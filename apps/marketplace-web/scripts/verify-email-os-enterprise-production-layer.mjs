import fs from "node:fs"

const files = [
  "app/(protected)/email-os/page.tsx",
  "components/email-os-core/EmailOSEnterpriseProductionWorkspace.tsx",
  "app/api/email-os/enterprise-workspace/route.ts",
  "app/api/email-os/enterprise-mailboxes/route.ts",
  "app/api/email-os/enterprise-record/route.ts"
]

let failed = false
console.log("EMAIL-OS ENTERPRISE PRODUCTION LAYER VERIFY")
console.log("===========================================")
for (const file of files) {
  const ok = fs.existsSync(file)
  console.log(`${ok ? "✓" : "✗"} ${file}`)
  if (!ok) failed = true
}

const all = files.filter((file) => fs.existsSync(file)).map((file) => fs.readFileSync(file, "utf8")).join("\n")
for (const marker of [
  "EmailOSEnterpriseProductionWorkspace",
  "enterprise-workspace",
  "enterprise-mailboxes",
  "enterprise-record",
  "Enterprise Copilot",
  "Department workspaces",
  "Mailbox Production Control",
  "message-action",
  "EnterpriseComposeModal"
]) {
  const ok = all.includes(marker)
  console.log(`${ok ? "✓" : "✗"} ${marker}`)
  if (!ok) failed = true
}

if (failed) process.exit(1)
console.log("Ready.")
