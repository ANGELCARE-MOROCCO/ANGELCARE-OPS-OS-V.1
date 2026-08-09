import fs from "node:fs"
import crypto from "node:crypto"
const baseline=process.env.MZ5_PRESERVATION_BASELINE
if(!baseline||!fs.existsSync(baseline)) throw new Error("MZ5_PRESERVATION_BASELINE is required")
const expected=JSON.parse(fs.readFileSync(baseline,"utf8"))
for(const [file,hash] of Object.entries(expected)){if(!fs.existsSync(file)) throw new Error(`Preservation file missing: ${file}`); const got=crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex"); if(got!==hash) throw new Error(`MZ1–MZ4 preservation mismatch: ${file}`)}
console.log("PASS — live pre-MZ5 hashes confirm MZ1–MZ4 protected files were not modified")
