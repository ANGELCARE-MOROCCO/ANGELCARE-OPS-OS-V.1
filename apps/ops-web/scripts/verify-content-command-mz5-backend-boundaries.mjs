import fs from "node:fs"
const manifest=fs.readFileSync("MZ5_PATCH_FILE_LIST.txt","utf8").split(/\r?\n/).filter(Boolean)
for(const file of manifest){if(file.includes("/app/api/")||file.includes("supabase/")||file.includes("migrations/")) throw new Error(`Backend boundary violation: ${file}`)}
const text=manifest.filter((file)=>file.endsWith(".ts")||file.endsWith(".tsx")).filter((file)=>fs.existsSync(file.replace(/^apps\/ops-web\//,""))).map((file)=>fs.readFileSync(file.replace(/^apps\/ops-web\//,""),"utf8")).join("\n")
for(const forbidden of ["service_role", "SUPABASE_SERVICE_ROLE", "CREATE TABLE", "ALTER TABLE"]){if(text.includes(forbidden)) throw new Error(`Privileged/backend marker introduced: ${forbidden}`)}
console.log("PASS — MZ5 introduces no API, database, Supabase, migration or privileged-client architecture")
