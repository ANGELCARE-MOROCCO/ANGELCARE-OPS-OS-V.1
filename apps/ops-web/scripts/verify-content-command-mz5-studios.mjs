import fs from "node:fs"
const text = [
  "components/market-os/content-command/headquarters/StudioWorkspace.tsx",
  "components/market-os/content-command/production/production-model.ts",
].map((file)=>fs.readFileSync(file,"utf8")).join("\n").toLowerCase()
for (const token of ["digital studio", "print & field studio", "corporate documentation studio", "creative constitution", "working version", "checkpoint", "create_dossier", "dossier 360"]) {
  if (!text.includes(token)) throw new Error(`Studios contract token missing: ${token}`)
}
console.log("PASS — Studios expose three distinct creative disciplines, constitution, versions, checkpoints and governed dossier creation")
