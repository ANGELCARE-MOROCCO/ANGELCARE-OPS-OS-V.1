import fs from "node:fs"
import { EMAIL_OS_PRODUCTION_ROUTES } from "../lib/email-os-core/production-routes.ts"

console.log("\nEMAIL-OS PROTECTED ROUTE FILE SCAN")
console.log("==================================")

let failed = false

for (const route of EMAIL_OS_PRODUCTION_ROUTES) {
  const rel = route === "/email-os"
    ? "app/(protected)/email-os/page.tsx"
    : `app/(protected)${route}/page.tsx`

  const ok = fs.existsSync(rel)
  console.log(`${ok ? "✓" : "✗"} ${rel}`)
  if (!ok) failed = true
}

if (failed) process.exit(1)
console.log("\nProtected route file scan passed.")
