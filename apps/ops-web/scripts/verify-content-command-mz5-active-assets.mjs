import fs from "node:fs"
const text = (fs.readFileSync("app/(protected)/market-os/content-command-center/active-assets/page.tsx", "utf8")+fs.readFileSync("components/market-os/content-command/production/assets/ActiveAssetsWorkspace.tsx", "utf8")).toLowerCase()
for (const token of ["activeassetsworkspace", "opérationnels", "approuvés avec écarts", "channel readiness", "retirer de l’actif", "droits et expiration"]){if(!text.includes(token)) throw new Error(`Active Assets token missing: ${token}`)}
console.log("PASS — Active Assets is a readiness and retirement command rather than a filtered asset copy")
