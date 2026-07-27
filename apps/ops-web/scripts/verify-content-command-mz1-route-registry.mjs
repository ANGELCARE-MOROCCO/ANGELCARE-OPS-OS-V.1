import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const routeRoot = path.join(root, "app/(protected)/market-os/content-command-center")
const registryPath = path.join(root, "components/market-os/content-command/content-command-navigation.tsx")

const expectedPermanent = [
  "",
  "active-assets",
  "ai-director",
  "ai-director/autopilot",
  "ai-director/commands",
  "ai-director/compiler",
  "ai-director/decisions",
  "ai-director/doctrine",
  "ai-director/integrations",
  "ai-director/learning",
  "ai-director/missions",
  "ai-director/queue",
  "ai-director/recovery",
  "ai-director/repository",
  "ai-director/runs",
  "ai-director/schedules",
  "ai-director/settings",
  "ai-director/skills",
  "ai-foundry",
  "assets",
  "brand-governance",
  "briefs",
  "calendar",
  "create",
  "directory",
  "distribution",
  "evidence",
  "legacy-operations",
  "missions",
  "publishing",
  "review",
  "signals",
  "source-vault",
  "strategies",
  "studio",
  "tasks",
  "tasks/execution",
  "validation",
].sort()

const expectedDynamic = [
  "[id]",
  "[id]/delete",
  "[id]/edit",
  "dossiers/[id]",
  "tasks/[taskId]",
  "tasks/[taskId]/edit",
].sort()

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(directory, entry.name)
    if (entry.isDirectory()) return walk(full)
    return entry.name === "page.tsx" ? [full] : []
  })
}

const pages = walk(routeRoot)
  .map((file) => path.relative(routeRoot, path.dirname(file)).replaceAll(path.sep, "/"))
  .map((route) => (route === "." ? "" : route))

const permanent = pages.filter((route) => !route.includes("[")).sort()
const dynamic = pages.filter((route) => route.includes("[")).sort()
const registry = fs.readFileSync(registryPath, "utf8")
const routeBlock = registry.split("export const contentCommandRoutes")[1]?.split("export const contentCommandContextRoutes")[0] || ""
const routeKeyMatches = [...routeBlock.matchAll(/\bkey:\s*"([^"]+)"/g)].map((match) => match[1])
const duplicateKeys = routeKeyMatches.filter((key, index) => routeKeyMatches.indexOf(key) !== index)

const failures = []
if (JSON.stringify(permanent) !== JSON.stringify(expectedPermanent)) {
  failures.push(`Permanent route mismatch. Found ${permanent.length}, expected ${expectedPermanent.length}.`)
}
if (JSON.stringify(dynamic) !== JSON.stringify(expectedDynamic)) {
  failures.push(`Dynamic route mismatch. Found ${dynamic.length}, expected ${expectedDynamic.length}.`)
}
if (routeKeyMatches.length !== 38) failures.push(`Registry contains ${routeKeyMatches.length} permanent entries; expected 38.`)
if (duplicateKeys.length) failures.push(`Duplicate route keys: ${[...new Set(duplicateKeys)].join(", ")}`)
if ((registry.match(/pattern:\s*new RegExp/g) || []).length !== 6) failures.push("Expected six contextual dynamic-route patterns.")
if (/href:\s*["'`]#/.test(registry)) failures.push("Dead # href found in registry.")

if (failures.length) {
  console.error("FAIL — Content Command MZ1 route registry")
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}

console.log(`PASS — ${permanent.length} permanent routes classified`)
console.log(`PASS — ${dynamic.length} dynamic routes contextualized`)
console.log("PASS — no duplicate route keys or dead hrefs")
