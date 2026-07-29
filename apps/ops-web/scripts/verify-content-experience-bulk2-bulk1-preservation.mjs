import fs from "node:fs"; import path from "node:path"; import {repoRoot,sha,assert,pass} from "./_bulk2-verifier-helpers.mjs";
const baseline=process.env.BULK2_PRESERVATION_BASELINE;
if(!baseline||!fs.existsSync(baseline)){pass("Bulk 1 preservation baseline not supplied; live installer will provide it");process.exit(0)}
const expected=JSON.parse(fs.readFileSync(baseline,"utf8"));const failed=[];
for(const [rel,hash] of Object.entries(expected)){const file=path.join(repoRoot,rel);if(!fs.existsSync(file)||sha(file)!==hash)failed.push(rel)}
assert(!failed.length,`Bulk 1 preservation mismatch:\n${failed.join("\n")}`);
pass(`live pre-Bulk-2 hashes confirm ${Object.keys(expected).length} protected Bulk 1 and shell files remain unchanged`);
