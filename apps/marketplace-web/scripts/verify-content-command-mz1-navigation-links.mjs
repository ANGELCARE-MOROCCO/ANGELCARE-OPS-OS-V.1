import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const routeRoot = path.join(root, "app/(protected)/market-os/content-command-center")
const registry = fs.readFileSync(path.join(root, "components/market-os/content-command/content-command-navigation.tsx"), "utf8")
const suffixes = [...registry.matchAll(/href:\s*`\$\{CONTENT_COMMAND_ROOT\}(\/[^`]*)`/g)].map((match) => match[1].slice(1))
const explicitRoot = /href:\s*CONTENT_COMMAND_ROOT/.test(registry)
const failures = []

if (!explicitRoot) failures.push("Commandement root route is missing.")
for (const suffix of suffixes) {
  const page = path.join(routeRoot, suffix, "page.tsx")
  if (!fs.existsSync(page)) failures.push(`Navigation target has no page.tsx: ${suffix}`)
}
if (new Set(suffixes).size !== suffixes.length) failures.push("Duplicate navigation href suffix detected.")

if (failures.length) {
  console.error("FAIL — Content Command MZ1 navigation links")
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}

console.log(`PASS — ${suffixes.length + 1} permanent navigation targets resolve to real pages`)
