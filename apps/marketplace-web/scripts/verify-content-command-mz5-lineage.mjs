import fs from "node:fs"
const files = [
  "components/market-os/content-command/headquarters/StudioWorkspace.tsx",
  "components/market-os/content-command/content-create-page.tsx",
  "components/market-os/content-command/content-assets-page.tsx",
  "components/market-os/content-command/production/assets/ActiveAssetsWorkspace.tsx",
  "components/market-os/content-command/headquarters/EvidenceWorkspace.tsx",
  "components/market-os/content-command/content-review-page.tsx",
]
const text = files.map((file)=>fs.readFileSync(file,"utf8")).join("\n")
for (const route of ["/briefs", "/dossiers/", "/evidence", "/review", "/validation", "/source-vault", "/distribution"]){if(!text.includes(route)) throw new Error(`Production lineage destination missing: ${route}`)}
console.log("PASS — MZ5 workspaces preserve real upstream and downstream Content Command destinations")
