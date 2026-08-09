import fs from "node:fs"
const manifest=fs.readFileSync("MZ5_PATCH_FILE_LIST.txt","utf8").split(/\r?\n/).filter(Boolean)
for(const listed of manifest){const file=listed.replace(/^apps\/ops-web\//,""); if(!fs.existsSync(file)) throw new Error(`Manifest file missing: ${file}`); if(file.endsWith("verify-content-command-mz5-portability.mjs")) continue; const data=fs.readFileSync(file); if(data.includes(0)) continue; const text=data.toString("utf8"); if(/\/mnt\/data|\/Users\/user|mz5_stubs|[A-Za-z]:\\/.test(text)) throw new Error(`Non-portable path in ${file}`)}
const config=JSON.parse(fs.readFileSync("tsconfig.market-os-content-command-mz5.json","utf8")); if(config.extends!=="./tsconfig.json") throw new Error("MZ5 tsconfig must extend ./tsconfig.json")
console.log("PASS — MZ5 TypeScript and patch configuration are repository-relative and portable")
