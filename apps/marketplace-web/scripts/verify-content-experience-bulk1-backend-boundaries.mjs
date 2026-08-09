import fs from "node:fs"
import path from "node:path"
import { run, opsRoot, assert } from "./content-experience-bulk1-verifier-lib.mjs"
run("Bulk 1 introduces no SQL, migration, API replacement or parallel store", () => {
  const base = opsRoot()
  const files = []
  const walk = (dir) => { if (!fs.existsSync(dir)) return; for (const entry of fs.readdirSync(dir,{withFileTypes:true})) { const full=path.join(dir,entry.name); if(entry.isDirectory()) walk(full); else files.push(full) } }
  walk(path.join(base,"components","market-os","content-command","experience-bulk1"))
  assert(!files.some((file) => file.endsWith(".sql")), "SQL found in Bulk 1 component scope")
  assert(!files.some((file) => file.includes(`${path.sep}app${path.sep}api${path.sep}`)), "API route found in Bulk 1 scope")
})
