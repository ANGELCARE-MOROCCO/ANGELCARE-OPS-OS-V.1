import fs from "node:fs"

const file = "components/service-os/ServiceOSPrimitives.tsx"
const content = fs.readFileSync(file, "utf8")
const required = [
  "export function ServiceOSButton",
  "export function ServiceOSCard",
  "export function ServiceOSGrid",
  "export function ServiceOSPanel",
  "export function ServiceOSPill",
  "children?: ReactNode",
  "children ?? text",
]
const missing = required.filter((item) => !content.includes(item))
if (missing.length) {
  console.error("ServiceOS Fix 02 failed. Missing:", missing.join(", "))
  process.exit(1)
}
console.log("ServiceOS Fix 02 passed: primitives support children/text compatibility.")
