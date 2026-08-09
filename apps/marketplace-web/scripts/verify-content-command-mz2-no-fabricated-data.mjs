import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const files = [
  "components/market-os/content-command/headquarters/DashboardWorkspace.tsx",
  "components/market-os/content-command/headquarters/DossierWorkspace.tsx",
  "components/market-os/content-command/headquarters/command/ExecutiveCommandSections.tsx",
  "components/market-os/content-command/headquarters/dossier/DossierSections.tsx",
  "components/market-os/content-command/headquarters/mz2-view-models.ts",
]
const source = files.map((relative) => fs.readFileSync(path.join(root, relative), "utf8")).join("\n")
const failures = []
const forbidden = [
  ["quarterWaves", "hard-coded strategic waves"],
  ["Fondation & activation", "fabricated 90-day milestone"],
  ["Rabat, Casablanca et Kénitra", "hard-coded geographic mandate"],
  ["Home Service, Academy", "hard-coded service mandate"],
  ["Math.random", "non-deterministic executive or audit identity"],
]
for (const [pattern, label] of forbidden) if (source.includes(pattern)) failures.push(`Detected ${label}: ${pattern}`)
if (!source.includes("Mandat exécutif non configuré")) failures.push("Missing honest mandate fallback.")
if (!source.includes("Non documenté") && !source.includes("non documenté")) failures.push("Missing explicit partial-data language.")
if (!source.includes("sourceType: \"legacy\"") || !source.includes("partial: true")) failures.push("Legacy records are not explicitly marked partial.")

if (failures.length) {
  console.error("FAIL — MZ2 data honesty")
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}
console.log("PASS — no fabricated mandate, wave, geography, service or random audit data introduced")
