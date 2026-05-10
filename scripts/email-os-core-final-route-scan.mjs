import fs from "node:fs"

const routes = [
  "app/(protected)/email-os/page.tsx",
  "app/(protected)/email-os/hub/page.tsx",
  "app/(protected)/email-os/onboarding/page.tsx",
  "app/(protected)/email-os/mailbox-testing/page.tsx",
  "app/(protected)/email-os/sync-operations/page.tsx",
  "app/(protected)/email-os/search/page.tsx",
  "app/(protected)/email-os/team-collaboration/page.tsx",
  "app/(protected)/email-os/sla-workflows/page.tsx",
  "app/(protected)/email-os/command-center/page.tsx",
  "app/(protected)/email-os/executive-execution/page.tsx",
  "app/(protected)/email-os/enterprise-hardening/page.tsx",
  "app/(protected)/email-os/final-command/page.tsx",
  "app/(protected)/email-os/final-readiness/page.tsx"
]

console.log("\nEMAIL-OS FINAL ROUTE SCAN")
console.log("=========================")

let failed = false
for (const route of routes) {
  const ok = fs.existsSync(route)
  console.log(`${ok ? "✓" : "✗"} ${route}`)
  if (!ok) failed = true
}

if (failed) process.exit(1)
console.log("\nEmail-OS final route scan passed.")
