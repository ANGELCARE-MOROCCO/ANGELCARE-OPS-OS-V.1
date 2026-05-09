import fs from "node:fs"
import path from "node:path"

const root = process.cwd()

const checks = [
  "lib/email-os/live/live-api.ts",
  "lib/email-os/live/live-types.ts",
  "lib/email-os/live/thread-normalizer.ts",
  "lib/email-os/live/use-live-threads.ts",
  "lib/email-os/live/use-compose-controller.ts",
  "lib/email-os/live/use-thread-actions.ts",
  "components/email-os/live/LiveStatusStrip.tsx",
  "components/email-os/v12/EmailOSV12LiveShell.tsx",
  "app/(protected)/email-os/page.tsx",
  "app/(protected)/email-os/inbox/page.tsx"
]

console.log("\nEMAIL-OS LIVE OPERATIONALIZATION QA")
console.log("===================================")

let failed = false
for (const rel of checks) {
  const ok = fs.existsSync(path.join(root, rel))
  console.log(`${ok ? "✓" : "✗"} ${rel}`)
  if (!ok) failed = true
}

if (failed) {
  console.error("\nLive operationalization QA failed.")
  process.exit(1)
}

console.log("\nLive operationalization QA passed.")
