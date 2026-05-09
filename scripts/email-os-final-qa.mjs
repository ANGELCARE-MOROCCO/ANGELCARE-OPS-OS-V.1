
import fs from "node:fs"
import path from "node:path"

const root = process.cwd()

const checks = [
  ["Enterprise dashboard", "components/email-os/v12/EnterpriseEmailOSDashboard.tsx"],
  ["Operations cockpit", "components/email-os/v12/EmailOSOperationsCockpit.tsx"],
  ["Admin governance", "components/email-os/v12/EmailOSAdminGovernanceCenter.tsx"],
  ["Execution engine", "lib/email-os/enterprise/execution-engine.ts"],
  ["Approval engine", "lib/email-os/enterprise/approval-engine.ts"],
  ["SLA engine", "lib/email-os/enterprise/sla-engine.ts"],
  ["Queue engine", "lib/email-os/enterprise/queue-engine.ts"],
  ["Audit engine", "lib/email-os/enterprise/audit-engine.ts"],
  ["Health API", "app/api/email-os/enterprise/health/route.ts"]
]

console.log("\nEMAIL-OS FINAL QA")
console.log("=================")

let failed = false
for (const [label, rel] of checks) {
  const exists = fs.existsSync(path.join(root, rel))
  console.log(`${exists ? "✓" : "✗"} ${label}: ${rel}`)
  if (!exists) failed = true
}

if (failed) {
  console.error("\nEmail-OS final QA failed.")
  process.exit(1)
}

console.log("\nEmail-OS final QA passed.")
