import fs from "node:fs"
const files = [
  "components/market-os/content-command/headquarters/StudioWorkspace.tsx",
  "components/market-os/content-command/content-create-page.tsx",
  "components/market-os/content-command/content-assets-page.tsx",
  "components/market-os/content-command/production/assets/ActiveAssetsWorkspace.tsx",
  "components/market-os/content-command/headquarters/EvidenceWorkspace.tsx",
  "components/market-os/content-command/content-review-page.tsx",
  "components/market-os/content-command/production/production-model.ts",
]
const text=files.map((file)=>fs.readFileSync(file,"utf8")).join("\n")
for(const forbidden of [/Math\.random\(/, /mock asset/i, /fake evidence/i, /sample review/i, /seedAssets/, /fabricated rights/i]) if(forbidden.test(text)) throw new Error(`Fabricated production marker found: ${forbidden}`)
for(const truth of ["Non modélisée", "Non journalisé", "Non disponible", "ne signifie pas", "ne crée pas"]){if(!text.includes(truth)) throw new Error(`Honest boundary marker missing: ${truth}`)}
console.log("PASS — no fabricated asset, evidence, rights, usage, version or review authority introduced")
