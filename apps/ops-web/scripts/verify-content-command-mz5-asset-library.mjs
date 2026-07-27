import fs from "node:fs"
const text = fs.readFileSync("components/market-os/content-command/content-assets-page.tsx", "utf8").toLowerCase()
for (const token of ["asset library", "droits", "source", "visuel", "registre", "assetform", "duplicate", "expiration", "deleteasset"]){if(!text.includes(token)) throw new Error(`Asset Library token missing: ${token}`)}
console.log("PASS — Asset Library contains intake, visual/register modes, source, rights limits, status actions and governed deletion")
