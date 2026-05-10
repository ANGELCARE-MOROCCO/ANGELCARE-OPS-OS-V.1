import fs from "node:fs"

const file = "lib/email-os-core/production-qa-manifest.ts"

console.log("\nEMAIL-OS QA MANIFEST CHECK")
console.log("==========================")

const ok = fs.existsSync(file)
console.log(`${ok ? "✓" : "✗"} ${file}`)

if (!ok) process.exit(1)

const text = fs.readFileSync(file, "utf8")
const count = (text.match(/area:/g) || []).length

console.log(`QA checks declared: ${count}`)

if (count < 10) {
  console.error("QA manifest is too small.")
  process.exit(1)
}

console.log("\nQA manifest looks ready.")
