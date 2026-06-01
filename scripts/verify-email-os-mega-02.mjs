import fs from "node:fs"
const file = "components/email-os-core/EnterpriseComposeModal.tsx"
console.log("EMAIL-OS MEGA 02 VERIFY")
if (!fs.existsSync(file)) process.exit(1)
const text = fs.readFileSync(file, "utf8")
for (const marker of ["New Message","Generate with AI","Schedule & Options","/api/email-os/send-direct","Save draft"]) {
  const ok = text.includes(marker)
  console.log(`${ok ? "✓" : "✗"} ${marker}`)
  if (!ok) process.exit(1)
}
