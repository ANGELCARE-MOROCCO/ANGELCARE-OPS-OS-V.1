import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const dossier = fs.readFileSync(path.join(root, "components/market-os/content-command/headquarters/dossier/DossierSections.tsx"), "utf8")
const command = fs.readFileSync(path.join(root, "components/market-os/content-command/headquarters/command/ExecutiveCommandSections.tsx"), "utf8")
const edit = fs.readFileSync(path.join(root, "components/market-os/content-command/headquarters/dossier/GovernedContentEditWorkspace.tsx"), "utf8")
const css = fs.readFileSync(path.join(root, "components/market-os/content-command/headquarters/mz2-executive-dossier.module.css"), "utf8")
const failures = []
const checks = [
  [dossier.includes('aria-label="Cycle de vie du dossier"'), "Dossier lifecycle has no accessible navigation label."],
  [dossier.includes('aria-current={stage.state === "current"'), "Current lifecycle stage has no aria-current."],
  [dossier.includes('aria-label="Actions contextuelles du dossier"'), "Contextual action rail has no accessible label."],
  [dossier.includes('aria-label="Sections du dossier"'), "Dossier section navigation has no accessible label."],
  [command.includes('aria-labelledby="cc-mz2-command-title"'), "Commandement main masthead lacks an accessible title relationship."],
  [command.includes('aria-label="Actions exécutives Content Command"'), "Command dock lacks an accessible label."],
  [edit.includes("aria-invalid"), "Governed edit fields do not expose invalid state accessibly."],
  [css.includes("prefers-reduced-motion"), "Reduced-motion support is missing."],
]
for (const [ok, message] of checks) if (!ok && message) failures.push(message)
if (failures.length) {
  console.error("FAIL — MZ2 accessibility contract")
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}
console.log("PASS — lifecycle, sections, actions, command regions and reduced motion are accessible")
