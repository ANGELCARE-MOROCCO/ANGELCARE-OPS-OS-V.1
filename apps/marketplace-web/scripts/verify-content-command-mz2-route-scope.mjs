import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const required = [
  "app/(protected)/market-os/content-command-center/page.tsx",
  "app/(protected)/market-os/content-command-center/dossiers/[id]/page.tsx",
  "app/(protected)/market-os/content-command-center/[id]/page.tsx",
  "app/(protected)/market-os/content-command-center/[id]/edit/page.tsx",
  "app/(protected)/market-os/content-command-center/[id]/delete/page.tsx",
]
const failures = []
for (const relative of required) {
  if (!fs.existsSync(path.join(root, relative))) failures.push(`Missing contracted route: ${relative}`)
}

const legacyDetail = fs.readFileSync(path.join(root, required[2]), "utf8")
const legacyEdit = fs.readFileSync(path.join(root, required[3]), "utf8")
const legacyDelete = fs.readFileSync(path.join(root, required[4]), "utf8")
if (!legacyDetail.includes("DossierWorkspace") || !legacyDetail.includes("compatibilityMode")) failures.push("Legacy detail route does not converge to Dossier 360 compatibility mode.")
if (!legacyEdit.includes("GovernedContentEditWorkspace")) failures.push("Legacy edit route does not mount the governed edit chamber.")
if (!legacyDelete.includes("GovernedContentLifecycleControl")) failures.push("Legacy delete route does not mount lifecycle control.")
if (![legacyDetail, legacyEdit, legacyDelete].every((source) => source.includes('dynamic = "force-dynamic"'))) failures.push("One or more compatibility routes lost force-dynamic behavior.")

if (failures.length) {
  console.error("FAIL — MZ2 contracted route scope")
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}
console.log("PASS — five contracted routes preserved and compatibility routes converge correctly")
