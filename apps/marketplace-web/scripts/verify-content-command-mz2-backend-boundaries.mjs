import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const patchMarker = "mz2"
const forbiddenRoots = ["app/api", "supabase/migrations", "lib/market-os/content-command/db"]
const failures = []
for (const relative of forbiddenRoots) {
  const directory = path.join(root, relative)
  if (!fs.existsSync(directory)) continue
  const entries = fs.readdirSync(directory, { recursive: true }).map(String)
  const marked = entries.filter((entry) => entry.toLowerCase().includes(patchMarker))
  if (marked.length) failures.push(`MZ2 backend/database files found under ${relative}: ${marked.join(", ")}`)
}
const files = [
  "components/market-os/content-command/headquarters/DashboardWorkspace.tsx",
  "components/market-os/content-command/headquarters/DossierWorkspace.tsx",
  "components/market-os/content-command/headquarters/command/ExecutiveCommandSections.tsx",
  "components/market-os/content-command/headquarters/dossier/DossierSections.tsx",
  "components/market-os/content-command/headquarters/dossier/GovernedContentEditWorkspace.tsx",
  "components/market-os/content-command/headquarters/dossier/GovernedContentLifecycleControl.tsx",
  "components/market-os/content-command/headquarters/mz2-view-models.ts",
]
const source = files.map((relative) => fs.readFileSync(path.join(root, relative), "utf8")).join("\n")
if (/supabase|prisma|service_role|database_url/i.test(source)) failures.push("MZ2 front-end files introduced direct database or privileged-client access.")
const fetches = [...source.matchAll(/fetch\(([^\n]+)/g)].map((match) => match[1])
const unexpectedFetches = fetches.filter((value) => !value.includes("sample-generate"))
if (unexpectedFetches.length) failures.push(`Unexpected new fetch calls: ${unexpectedFetches.join(" | ")}`)

if (failures.length) {
  console.error("FAIL — MZ2 backend and database boundaries")
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}
console.log("PASS — no MZ2 API, database, Supabase or privileged-client architecture introduced")
