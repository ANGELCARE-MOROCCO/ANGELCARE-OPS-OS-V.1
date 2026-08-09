import fs from "node:fs"
import path from "node:path"
import { run, repoRoot, sha256, assert } from "./content-experience-bulk1-verifier-lib.mjs"
run("Live protected Content Command files remain byte-identical", () => {
  const baseline=process.env.BULK1_PRESERVATION_BASELINE
  if(!baseline){console.log("SKIP — BULK1_PRESERVATION_BASELINE not supplied; package verifier will provide it");return}
  const expected=JSON.parse(fs.readFileSync(baseline,"utf8"))
  for(const [relative,hash] of Object.entries(expected)){const file=path.join(repoRoot(),relative);assert(fs.existsSync(file),`Protected file missing: ${relative}`);assert(sha256(file)===hash,`Protected file changed: ${relative}`)}
})
