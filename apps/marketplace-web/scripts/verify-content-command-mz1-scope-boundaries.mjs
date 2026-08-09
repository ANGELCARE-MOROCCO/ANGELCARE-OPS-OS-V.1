import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const forbiddenRoots = [
  "app/api/market-os/content-command-center",
  "app/api/market-os/content-command",
  "supabase/migrations",
]
const marker = "MEGA_ZIP_1"
const failures = []
for (const relative of forbiddenRoots) {
  const directory = path.join(root, relative)
  if (!fs.existsSync(directory)) continue
  const files = fs.readdirSync(directory, { recursive: true }).map(String)
  const unexpected = files.filter((file) => file.toUpperCase().includes(marker))
  if (unexpected.length) failures.push(`Forbidden backend/database MZ1 files under ${relative}: ${unexpected.join(", ")}`)
}
const shell = fs.readFileSync(path.join(root, "components/market-os/content-command/ContentCommand360Shell.tsx"), "utf8")
if (/fetch\(|supabase|prisma|database/i.test(shell)) failures.push("Sovereign shell introduced backend/database access.")

if (failures.length) {
  console.error("FAIL — Content Command MZ1 scope boundaries")
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}
console.log("PASS — no MZ1 API, backend or database architecture introduced")
