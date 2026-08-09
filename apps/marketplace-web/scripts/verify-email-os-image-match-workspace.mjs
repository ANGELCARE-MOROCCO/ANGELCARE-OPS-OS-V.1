import fs from "node:fs"
const file = "components/email-os-core/EmailOSWorkspacePro.tsx"
console.log("\nEMAIL-OS IMAGE MATCH WORKSPACE VERIFY")
console.log("====================================")
if (!fs.existsSync(file)) process.exit(1)
const text = fs.readFileSync(file, "utf8")
const markers = ["AI Assistant", "Related Contacts", "Activity Timeline", "Smart Views", "Primary", "Partnership Proposal", "Live Operations"]
let failed = false
for (const marker of markers) {
  const ok = text.includes(marker)
  console.log(`${ok ? "✓" : "✗"} ${marker}`)
  if (!ok) failed = true
}
if (failed) process.exit(1)
console.log("\nImage-match Email-OS workspace is present.")
