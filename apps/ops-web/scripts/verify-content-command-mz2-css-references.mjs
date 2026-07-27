import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const cssPath = path.join(root, "components/market-os/content-command/headquarters/mz2-executive-dossier.module.css")
const css = fs.readFileSync(cssPath, "utf8")
const cssClasses = new Set([...css.matchAll(/\.([A-Za-z_][\w-]*)/g)].map((match) => match[1]))
const components = [
  "components/market-os/content-command/headquarters/DashboardWorkspace.tsx",
  "components/market-os/content-command/headquarters/DossierWorkspace.tsx",
  "components/market-os/content-command/headquarters/command/ExecutiveCommandSections.tsx",
  "components/market-os/content-command/headquarters/dossier/DossierSections.tsx",
  "components/market-os/content-command/headquarters/dossier/GovernedContentEditWorkspace.tsx",
  "components/market-os/content-command/headquarters/dossier/GovernedContentLifecycleControl.tsx",
]
const references = new Set()
for (const relative of components) {
  const source = fs.readFileSync(path.join(root, relative), "utf8")
  for (const match of source.matchAll(/styles\.([A-Za-z_][\w]*)/g)) references.add(match[1])
}
const missing = [...references].filter((name) => !cssClasses.has(name)).sort()
const failures = []
if (missing.length) failures.push(...missing.map((name) => `Missing CSS module class: ${name}`))
if (!css.includes('[data-experience-mode="focus"]')) failures.push("Final Mega ZIP 1 experience-mode selector is not supported.")
if (!css.includes('[data-density="compact"]')) failures.push("Final Mega ZIP 1 density selector is not supported.")
if (!css.includes("prefers-reduced-motion")) failures.push("Reduced-motion styling is missing.")

if (failures.length) {
  console.error("FAIL — MZ2 CSS references")
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}
console.log(`PASS — ${references.size} MZ2 CSS-module references resolve`)
