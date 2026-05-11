import fs from "node:fs"

const required = [
  "data/angelcare_email_templates.json",
  "lib/email-os-core/angelcare-email-templates.ts",
  "database/email-os-angelcare-ultra-template-seed.sql",
  "components/email-os-core/AngelcareTemplateBrowser.tsx"
]

console.log("\nANGELCARE EMAIL TEMPLATE PACK VERIFY")
console.log("====================================")

let failed = false
for (const file of required) {
  const ok = fs.existsSync(file)
  console.log(`${ok ? "✓" : "✗"} ${file}`)
  if (!ok) failed = true
}

const data = JSON.parse(fs.readFileSync("data/angelcare_email_templates.json", "utf8"))
console.log(`\nTemplates loaded: ${data.length}`)
if (data.length < 150) {
  console.log("✗ Expected at least 150 templates")
  failed = true
}

if (failed) process.exit(1)
console.log("✓ Template pack ready.")
