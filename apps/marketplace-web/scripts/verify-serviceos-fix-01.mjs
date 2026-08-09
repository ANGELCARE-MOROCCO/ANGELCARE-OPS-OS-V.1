import fs from "node:fs"

const file = "components/service-os/ServiceOSPrimitives.tsx"
const required = ["ServiceOSButton", "ServiceOSCard", "ServiceOSGrid", "ServiceOSPanel", "ServiceOSPill"]
const content = fs.readFileSync(file, "utf8")
const missing = required.filter((name) => !content.includes(`export function ${name}`))

if (missing.length) {
  console.error(`Missing exports in ${file}: ${missing.join(", ")}`)
  process.exit(1)
}

console.log("ServiceOS primitive exports are present.")
