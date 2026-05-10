import fs from "node:fs"
import path from "node:path"

const forbiddenDirs = [
  "components/email-os/v12",
  "components/email-os/v13",
  "components/email-os/v15",
  "_email_os_fake_quarantine"
]

const forbiddenTokens = [
  "EmailOSV12Shell",
  "EmailOSV13",
  "EmailOSV15",
  "SubmodulePageShell",
  "seedThreads",
  "fake demo"
]

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out
  for (const item of fs.readdirSync(dir)) {
    const full = path.join(dir, item)
    const stat = fs.statSync(full)
    if (stat.isDirectory()) walk(full, out)
    else if (/\.(ts|tsx|js|mjs)$/.test(full)) out.push(full)
  }
  return out
}

console.log("\nEMAIL-OS FINAL LEGACY SCAN")
console.log("==========================")

let failed = false

for (const dir of forbiddenDirs) {
  const exists = fs.existsSync(dir)
  console.log(`${exists ? "✗" : "✓"} ${dir}`)
  if (exists) failed = true
}

for (const file of [...walk("app"), ...walk("components"), ...walk("lib")]) {
  const text = fs.readFileSync(file, "utf8")
  for (const token of forbiddenTokens) {
    if (text.includes(token)) {
      console.log(`✗ ${file} contains ${token}`)
      failed = true
    }
  }
}

if (failed) process.exit(1)
console.log("\nNo final legacy conflicts found.")
