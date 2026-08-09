import fs from "node:fs"

const required = [
  "lib/email-os-core/mailbox-onboarding-model.ts",
  "components/email-os-core/premium/PremiumField.tsx",
  "components/email-os-core/premium/MailboxReadinessCard.tsx",
  "components/email-os-core/premium/PremiumMailboxOnboardingWizard.tsx",
  "components/email-os-core/premium/PremiumMailboxManagementPanel.tsx",
  "app/(protected)/email-os/mailbox-setup/page.tsx",
  "app/(protected)/email-os/mailboxes-premium/page.tsx"
]

console.log("\nEMAIL-OS CORE PHASE 31 VERIFY")
console.log("=============================")

let failed = false
for (const file of required) {
  const ok = fs.existsSync(file)
  console.log(`${ok ? "✓" : "✗"} ${file}`)
  if (!ok) failed = true
}

if (failed) process.exit(1)
console.log("\nPhase 31 premium UX onboarding verification passed.")
