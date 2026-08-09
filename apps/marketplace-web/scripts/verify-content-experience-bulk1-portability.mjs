import fs from "node:fs"
import path from "node:path"
import { run, opsRoot, assert } from "./content-experience-bulk1-verifier-lib.mjs"
run("Bulk 1 package and TypeScript configuration are repository-relative", () => {
  const root=opsRoot(); const targets=[path.join(root,"tsconfig.market-os-content-experience-bulk1.json"),path.join(root,"components","market-os","content-command","experience-bulk1")]
  const files=[]; const walk=(target)=>{const stat=fs.statSync(target);if(stat.isDirectory())for(const name of fs.readdirSync(target))walk(path.join(target,name));else files.push(target)}; targets.forEach(walk)
  const forbidden=["/"+["mnt","data"].join("/"),"/"+["Users","user"].join("/")];for(const file of files){const text=fs.readFileSync(file,"utf8");for(const marker of forbidden)assert(!text.includes(marker),`${file}: environment-specific path reference`)}
})
