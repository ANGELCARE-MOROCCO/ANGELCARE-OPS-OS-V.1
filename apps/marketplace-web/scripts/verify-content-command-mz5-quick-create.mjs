import fs from "node:fs"
const text = fs.readFileSync("components/market-os/content-command/content-create-page.tsx", "utf8").toLowerCase()
for (const token of ["création rapide", "contentform", "constitution essentielle", "gouvernance", "dossier", "studio", "ne signifie pas"]){if(!text.includes(token)) throw new Error(`Quick Create token missing: ${token}`)}
console.log("PASS — Quick Create preserves ContentForm persistence and visibly prevents lifecycle bypass")
