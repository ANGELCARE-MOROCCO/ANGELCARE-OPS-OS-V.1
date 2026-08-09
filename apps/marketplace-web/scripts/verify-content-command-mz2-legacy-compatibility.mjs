import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const workspace = fs.readFileSync(path.join(root, "components/market-os/content-command/headquarters/DossierWorkspace.tsx"), "utf8")
const edit = fs.readFileSync(path.join(root, "components/market-os/content-command/headquarters/dossier/GovernedContentEditWorkspace.tsx"), "utf8")
const lifecycle = fs.readFileSync(path.join(root, "components/market-os/content-command/headquarters/dossier/GovernedContentLifecycleControl.tsx"), "utf8")
const failures = []
if (!workspace.includes("useContentStore")) failures.push("Dossier compatibility adapter no longer reads the existing content store.")
if (!workspace.includes("buildLegacyDossierViewModel")) failures.push("Legacy view-model conversion is missing.")
if (!workspace.includes("Mode de compatibilité historique")) failures.push("Historical compatibility disclosure is missing.")
if (!edit.includes("beforeunload")) failures.push("Governed edit does not protect unsaved changes.")
if (!edit.includes("Motif d’amendement")) failures.push("Approved/published record amendment reason is missing.")
if (!lifecycle.includes("Archiver le dossier")) failures.push("Safe archive outcome is missing.")
if (!lifecycle.includes("SUPPRIMER ${currentItem.title}")) failures.push("Typed permanent-deletion confirmation is missing.")
if (!lifecycle.includes("draft.tasks = draft.tasks.filter") || !lifecycle.includes("draft.assets = draft.assets.filter")) failures.push("Permanent deletion does not preserve the existing dependency cleanup behavior.")

if (failures.length) {
  console.error("FAIL — MZ2 legacy compatibility and governance")
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}
console.log("PASS — legacy detail, edit, archive and permanent deletion remain compatible and governed")
