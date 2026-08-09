import fs from "node:fs"; import path from "node:path"; import {opsRoot,assert,read,contains,pass} from "./_bulk2-verifier-helpers.mjs";
const dir=path.join(opsRoot,"components/market-os/content-command/experience-bulk2");
const files=fs.readdirSync(dir).filter(f=>/\.(ts|tsx)$/.test(f));const all=files.map(f=>fs.readFileSync(path.join(dir,f),"utf8")).join("\n");
assert(!all.includes("service_role"),"service-role authority leaked into client code");
assert(!all.includes("createClient("),"parallel Supabase client introduced");
assert(!all.includes("/api/")||all.includes("headquartersAction"),"new direct API architecture introduced");
contains("components/market-os/content-command/experience-bulk2/Bulk2ObservatoryWorkspace.tsx",["headquartersAction"]);
contains("components/market-os/content-command/experience-bulk2/Bulk2BriefingWorkspace.tsx",["useContentStore"]);
pass("Bulk 2 preserves existing Headquarters actions and Content Store persistence without API/database replacement");
