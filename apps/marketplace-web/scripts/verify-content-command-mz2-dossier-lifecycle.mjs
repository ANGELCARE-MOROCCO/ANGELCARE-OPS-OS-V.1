import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const workspace = fs.readFileSync(path.join(root, "components/market-os/content-command/headquarters/DossierWorkspace.tsx"), "utf8")
const sections = fs.readFileSync(path.join(root, "components/market-os/content-command/headquarters/dossier/DossierSections.tsx"), "utf8")
const model = fs.readFileSync(path.join(root, "components/market-os/content-command/headquarters/mz2-view-models.ts"), "utf8")
const failures = []
const requiredComponents = [
  "DossierIdentityHeader",
  "DossierLifecycleSpine",
  "DossierConstitution",
  "DossierLineageOwnership",
  "DossierBrief",
  "DossierExecution",
  "DossierCreativeEvidence",
  "DossierDecisions",
  "DossierSourcesDistribution",
  "DossierCollaborationAudit",
  "DossierActionRail",
]
for (const component of requiredComponents) if (!workspace.includes(`<${component}`)) failures.push(`Dossier 360 is missing ${component}.`)
const requiredMarkers = [
  "DOSSIER CONSTITUTION",
  "STRATEGIC LINEAGE",
  "OWNERSHIP & AUTHORITY",
  "BRIEF CHAMBER",
  "EXECUTION & DEPENDENCIES",
  "CREATIVE WORKBENCH",
  "EVIDENCE CHAMBER",
  "REVIEW & VALIDATION HISTORY",
  "CANONICAL SOURCE & VERSIONS",
  "DISTRIBUTION & PUBLICATION",
  "COLLABORATION & AUDIT",
]
for (const marker of requiredMarkers) if (!sections.includes(marker)) failures.push(`Missing dossier chamber: ${marker}`)
if (!model.includes("DOSSIER_STAGES")) failures.push("Dossier lifecycle stage model is missing.")
if (!model.includes('sourceType: "legacy"') || !model.includes('partial: true')) failures.push("Historical partial-data adapter is missing.")
if (!sections.includes("RECOMMANDATION IA") || !sections.includes("DÉCISION HUMAINE")) failures.push("AI and human decisions are not visibly separated.")
if (!sections.includes("SOURCE CANONIQUE COURANTE") || !sections.includes("rendition")) failures.push("Canonical source and rendition distinction is incomplete.")

if (failures.length) {
  console.error("FAIL — MZ2 Dossier 360 lifecycle contract")
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}
console.log("PASS — Dossier 360 exposes identity, lifecycle, constitution, evidence, decisions, source and distribution")
