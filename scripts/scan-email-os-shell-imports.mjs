import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const targets = []

function walk(dir) {
  if (!fs.existsSync(dir)) return

  for (const item of fs.readdirSync(dir)) {
    const full = path.join(dir, item)
    const stat = fs.statSync(full)

    if (stat.isDirectory()) {
      walk(full)
      continue
    }

    if (!full.endsWith(".tsx") && !full.endsWith(".ts")) continue
    if (!full.includes(`${path.sep}email-os${path.sep}`)) continue

    const content = fs.readFileSync(full, "utf8")

    const hasNamedShellImport =
      content.includes('import { EmailOSV12Shell }') ||
      content.includes("import {EmailOSV12Shell}")

    const hasModeProp =
      content.includes("<EmailOSV12Shell mode=") ||
      content.includes("mode=\"access\"") ||
      content.includes("mode='access'") ||
      content.includes("mode=\"compose\"") ||
      content.includes("mode='compose'")

    if (hasNamedShellImport || hasModeProp) {
      targets.push({
        file: path.relative(root, full),
        hasNamedShellImport,
        hasModeProp
      })
    }
  }
}

walk(path.join(root, "app"))

console.log("\nEMAIL-OS SHELL IMPORT / PROP SCAN")
console.log("=================================")

if (targets.length === 0) {
  console.log("✓ No old EmailOSV12Shell named imports or mode props found.")
  process.exit(0)
}

for (const item of targets) {
  console.log(`✗ ${item.file}`)
  if (item.hasNamedShellImport) console.log("  - uses named import: import { EmailOSV12Shell }")
  if (item.hasModeProp) console.log("  - uses old mode prop")
}

console.log("\nFix pattern:")
console.log('import EmailOSV12Shell from "@/components/email-os/v12/EmailOSV12Shell"')
console.log('return <EmailOSV12Shell initialPage="configuration" />')

process.exit(1)
