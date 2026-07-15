import fs from "node:fs"

const required = [
  "database/email-os-core-phase29-final-completion.sql",
  "lib/email-os-core/final-rbac.ts",
  "lib/email-os-core/final-ai.ts",
  "lib/email-os-core/final-navigation.ts",
  "app/api/email-os/final/reliability/run/route.ts",
  "app/api/email-os/final/threading/repair/route.ts",
  "app/api/email-os/final/spam/evaluate/route.ts",
  "app/api/email-os/final/realtime/poll/route.ts",
  "app/api/email-os/final/realtime/ack/route.ts",
  "app/api/email-os/final/ai/status/route.ts",
  "app/api/email-os/final/ai/draft-reply/route.ts",
  "app/api/email-os/final/ai/memory-search/route.ts",
  "app/api/email-os/final/security/status/route.ts",
  "app/api/email-os/final/security/enforce/route.ts",
  "app/api/email-os/final/readiness/route.ts",
  "hooks/useEmailOSLiveRefresh.ts",
  "components/email-os-core/FinalLiveOperationsWidget.tsx",
  "components/email-os-core/FinalCommandCenterPanel.tsx",
  "app/(protected)/email-os/final-command/page.tsx",
  "app/(protected)/email-os/final-readiness/page.tsx"
]

console.log("\nEMAIL-OS CORE PHASE 29 FINAL VERIFY")
console.log("===================================")

let failed = false
for (const file of required) {
  const ok = fs.existsSync(file)
  console.log(`${ok ? "✓" : "✗"} ${file}`)
  if (!ok) failed = true
}

if (failed) process.exit(1)
console.log("\nPhase 29 final completion verification passed.")
