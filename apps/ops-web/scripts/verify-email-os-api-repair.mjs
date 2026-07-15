import fs from "node:fs"
import path from "node:path"

const root = "app/api/email-os"
let failed = false
let corrupted = []

function walk(dir) {
  if (!fs.existsSync(dir)) return []
  const out = []
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name)
    const stat = fs.statSync(full)
    if (stat.isDirectory()) out.push(...walk(full))
    else if (full.endsWith(".ts") || full.endsWith(".tsx")) out.push(full)
  }
  return out
}

for (const file of walk(root)) {
  const text = fs.readFileSync(file, "utf8")
  if (text.includes("} catch {}")) {
    corrupted.push(file)
    failed = true
  }
  if (/=\s*try\s*\{/.test(text)) {
    corrupted.push(file + " contains '= try {'")
    failed = true
  }
}

console.log("\nEMAIL-OS API REPAIR VERIFY")
console.log("==========================")
console.log(`Files scanned: ${walk(root).length}`)
console.log(`Corruption markers found: ${corrupted.length}`)

for (const item of corrupted) console.log("✗", item)

if (failed) process.exit(1)
console.log("✓ No known corruption markers remain.")
