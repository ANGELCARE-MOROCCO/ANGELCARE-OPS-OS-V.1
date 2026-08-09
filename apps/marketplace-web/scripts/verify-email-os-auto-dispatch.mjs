import fs from "node:fs"

const required = [
  "app/api/email-os/dispatch-now/route.ts",
  "docs/PATCH_PRODUCTION_COMPOSE_AUTO_DISPATCH.md"
]

console.log("\nEMAIL-OS AUTO DISPATCH VERIFY")
console.log("=============================")

let failed = false

for (const file of required) {
  const ok = fs.existsSync(file)
  console.log(`${ok ? "✓" : "✗"} ${file}`)
  if (!ok) failed = true
}

if (failed) process.exit(1)

console.log("\nAuto-dispatch route is present.")
