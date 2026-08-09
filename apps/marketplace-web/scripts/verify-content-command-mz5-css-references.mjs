import fs from "node:fs"
const targets = [
  "components/market-os/content-command/headquarters/StudioWorkspace.tsx",
  "components/market-os/content-command/content-create-page.tsx",
  "components/market-os/content-command/content-assets-page.tsx",
  "components/market-os/content-command/production/assets/ActiveAssetsWorkspace.tsx",
  "components/market-os/content-command/headquarters/EvidenceWorkspace.tsx",
  "components/market-os/content-command/content-review-page.tsx",
  "components/market-os/content-command/production/production-ui.tsx",
]
const declaration=fs.readFileSync("components/market-os/content-command/production/production-system.module.css.d.ts","utf8")
const refs=new Set()
for(const file of targets){const text=fs.readFileSync(file,"utf8"); for(const match of text.matchAll(/styles\.([A-Za-z_][\w]*)/g)) refs.add(match[1])}
const missing=[...refs].filter((name)=>!declaration.includes(`readonly \"${name}\"`))
if(missing.length) throw new Error(`MZ5 CSS declarations missing: ${missing.join(", ")}`)
console.log(`PASS — ${refs.size} MZ5 CSS-module references resolve`)
