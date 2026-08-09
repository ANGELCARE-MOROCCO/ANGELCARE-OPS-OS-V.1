import fs from "node:fs"

const required = [
  "database/email-os-core-phase28-enterprise-hardening.sql",
  "app/api/email-os/reliability/failover-decision/route.ts",
  "app/api/email-os/reliability/smtp-retry-policy/route.ts",
  "app/api/email-os/reliability/imap-checkpoint/route.ts",
  "app/api/email-os/reliability/spam-rules/route.ts",
  "app/api/email-os/reliability/attachment-pipeline/route.ts",
  "app/api/email-os/realtime/publish/route.ts",
  "app/api/email-os/realtime/channels/route.ts",
  "app/api/email-os/realtime/subscribe/route.ts",
  "app/api/email-os/ai/memory/route.ts",
  "app/api/email-os/ai/workflow-plan/route.ts",
  "app/api/email-os/ai/copilot-action/route.ts",
  "app/api/email-os/ai/resolution-suggest/route.ts",
  "app/api/email-os/security/rbac/evaluate/route.ts",
  "app/api/email-os/security/rbac/seed/route.ts",
  "app/api/email-os/security/audit-events/route.ts",
  "app/api/email-os/security/secret-vault-ref/route.ts",
  "components/email-os-core/EnterpriseHardeningMegaPanel.tsx",
  "components/email-os-core/EnterpriseEmptyState.tsx",
  "components/email-os-core/EnterpriseLoadingShell.tsx",
  "app/(protected)/email-os/enterprise-hardening/page.tsx",
  "app/(protected)/email-os/product-maturity/page.tsx"
]

console.log("\nEMAIL-OS CORE PHASE 28 MEGA VERIFY")
console.log("==================================")

let failed = false
for (const file of required) {
  const ok = fs.existsSync(file)
  console.log(`${ok ? "✓" : "✗"} ${file}`)
  if (!ok) failed = true
}

if (failed) process.exit(1)

console.log("\nPhase 28 enterprise hardening mega verification passed.")
