import fs from "node:fs"

const checks = [
  {
    file: "components/email-os-core/EnterpriseComposeModal.tsx",
    must: ["top-[86px]", "h-[calc(100vh-118px)]", "z-[80]"],
    mustNot: ["fixed inset-0 z-[999]", "h-[94vh]"]
  },
  {
    file: "components/email-os-core/ProductionComposeStudio.tsx",
    must: ["top-[86px]", "z-[80]"],
    mustNot: ["fixed inset-0 z-[90]"]
  },
  {
    file: "components/email-os-core/BulkActionsBar.tsx",
    must: ["bottom-24", "z-[60]"],
    mustNot: ["bottom-6 left-1/2 z-[70]"]
  }
]

let failed = false

console.log("EMAIL-OS SHELL-SAFE OVERLAY FIX VERIFY")
console.log("======================================")

for (const check of checks) {
  if (!fs.existsSync(check.file)) {
    console.log(`✗ ${check.file}`)
    failed = true
    continue
  }

  const text = fs.readFileSync(check.file, "utf8")
  console.log(`✓ ${check.file}`)

  for (const marker of check.must) {
    const ok = text.includes(marker)
    console.log(`${ok ? "✓" : "✗"} ${check.file}: ${marker}`)
    if (!ok) failed = true
  }

  for (const marker of check.mustNot) {
    const ok = !text.includes(marker)
    console.log(`${ok ? "✓" : "✗"} ${check.file}: removed ${marker}`)
    if (!ok) failed = true
  }
}

if (failed) process.exit(1)
console.log("Ready.")
