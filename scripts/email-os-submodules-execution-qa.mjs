import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const checks = [
  "components/email-os/submodules/SubmoduleKit.tsx",
  "components/email-os/submodules/SubmodulePageShell.tsx",
  "components/email-os/submodules/MailboxesExecutionWorkspace.tsx",
  "components/email-os/submodules/ConfigurationExecutionWorkspace.tsx",
  "components/email-os/submodules/TemplatesExecutionWorkspace.tsx",
  "components/email-os/submodules/AutomationExecutionWorkspace.tsx",
  "components/email-os/submodules/ApprovalsExecutionWorkspace.tsx",
  "components/email-os/submodules/OutboxExecutionWorkspace.tsx",
  "components/email-os/submodules/AuditExecutionWorkspace.tsx",
  "components/email-os/submodules/AnalyticsExecutionWorkspace.tsx",
  "components/email-os/submodules/RuntimeExecutionWorkspace.tsx",
  "app/(protected)/email-os/mailboxes/page.tsx",
  "app/(protected)/email-os/configuration/page.tsx",
  "app/(protected)/email-os/templates/page.tsx",
  "app/(protected)/email-os/automation/page.tsx",
  "app/(protected)/email-os/approvals/page.tsx",
  "app/(protected)/email-os/outbox/page.tsx",
  "app/(protected)/email-os/audit/page.tsx"
]

console.log("\nEMAIL-OS SUBMODULES EXECUTION QA")
console.log("================================")

let failed = false
for (const rel of checks) {
  const ok = fs.existsSync(path.join(root, rel))
  console.log(`${ok ? "✓" : "✗"} ${rel}`)
  if (!ok) failed = true
}

if (failed) {
  console.error("\nSubmodules execution QA failed.")
  process.exit(1)
}

console.log("\nSubmodules execution QA passed.")
