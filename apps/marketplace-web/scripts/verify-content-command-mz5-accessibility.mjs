import fs from "node:fs"
const text=[
  "components/market-os/content-command/headquarters/StudioWorkspace.tsx",
  "components/market-os/content-command/content-assets-page.tsx",
  "components/market-os/content-command/headquarters/EvidenceWorkspace.tsx",
  "components/market-os/content-command/content-review-page.tsx",
  "components/market-os/content-command/production/production-system.module.css",
].map((file)=>fs.readFileSync(file,"utf8")).join("\n")
for(const token of ["role=\"dialog\"", "aria-modal=\"true\"", "aria-label=", "aria-current=", "prefers-reduced-motion", "alt="]){if(!text.includes(token)) throw new Error(`Accessibility token missing: ${token}`)}
console.log("PASS — MZ5 includes dialog semantics, labels, current selection, image alternatives and reduced-motion support")
