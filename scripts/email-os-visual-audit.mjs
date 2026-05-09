import fs from "node:fs"
import path from "node:path"

const root = process.cwd()

const required = [
  "components/email-os/v12/EmailOSV12Shell.tsx",
  "components/email-os/visual-system/email-os-design-tokens.ts",
  "app/(protected)/email-os/page.tsx",
  "app/(protected)/email-os/inbox/page.tsx",
  "app/(protected)/email-os/compose/page.tsx",
  "app/(protected)/email-os/templates/page.tsx",
  "app/(protected)/email-os/automation/page.tsx"
]

console.log("\nEMAIL-OS VISUAL REBUILD AUDIT")
console.log("=============================")

let failed = false
for (const rel of required) {
  const exists = fs.existsSync(path.join(root, rel))
  console.log(`${exists ? "✓" : "✗"} ${rel}`)
  if (!exists) failed = true
}

if (failed) {
  console.error("\nVisual rebuild audit failed.")
  process.exit(1)
}

console.log("\nVisual rebuild audit passed.")
