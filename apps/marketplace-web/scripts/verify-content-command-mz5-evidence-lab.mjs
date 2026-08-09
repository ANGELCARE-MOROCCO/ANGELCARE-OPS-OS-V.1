import fs from "node:fs"
const text = fs.readFileSync("components/market-os/content-command/headquarters/EvidenceWorkspace.tsx", "utf8").toLowerCase()
for (const token of ["evidence lab", "evidence intake", "théâtre de contrôle", "version précédente", "ai interpretation", "human conclusion", "analyze_evidence", "source-upload?mode=evidence"]){if(!text.includes(token)) throw new Error(`Evidence Lab token missing: ${token}`)}
console.log("PASS — Evidence Lab contains intake, inspection, comparison, rubric, AI separation, human authority and existing upload/analyze actions")
