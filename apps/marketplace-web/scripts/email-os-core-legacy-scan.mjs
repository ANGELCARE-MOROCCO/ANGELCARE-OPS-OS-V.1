import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const forbidden = [
  "components/email-os/v12",
  "components/email-os/v13",
  "components/email-os/v15",
  "components/email-os/submodules",
  "_email_os_fake_quarantine",
  "_REMOVED_EMAIL_OS"
]

const forbiddenText = [
  "EmailOSV12Shell",
  "EmailOSV12LiveShell",
  "EmailOSV13ProductionShell",
  "EmailOSV15ProductionShell",
  "SubmodulePageShell",
  "Executable workflow item",
  "seedThreads",
  "initialMailboxes"
]

console.log("\nEMAIL-OS LEGACY CONFLICT SCAN")
console.log("=============================")

let failed = false

for (const rel of forbidden) {
  const exists = fs.existsSync(path.join(root, rel))
  console.log(`${exists ? "✗" : "✓"} ${rel}`)
  if (exists) failed = true
}

function walk(dir, results = []) {
  if (!fs.existsSync(dir)) return results
  for (const item of fs.readdirSync(dir)) {
    const full = path.join(dir, item)
    const stat = fs.statSync(full)
    if (stat.isDirectory()) walk(full, results)
    else if (/\.(ts|tsx|js|mjs)$/.test(full)) results.push(full)
  }
  return results
}

const files = [
  ...walk(path.join(root, "app")),
  ...walk(path.join(root, "components")),
  ...walk(path.join(root, "lib"))
]

for (const file of files) {
  const text = fs.readFileSync(file, "utf8")
  for (const token of forbiddenText) {
    if (text.includes(token)) {
      console.log(`✗ ${path.relative(root, file)} contains ${token}`)
      failed = true
    }
  }
}

if (failed) {
  console.error("\nLegacy Email-OS conflicts found.")
  process.exit(1)
}

console.log("\nNo legacy Email-OS conflicts found.")
