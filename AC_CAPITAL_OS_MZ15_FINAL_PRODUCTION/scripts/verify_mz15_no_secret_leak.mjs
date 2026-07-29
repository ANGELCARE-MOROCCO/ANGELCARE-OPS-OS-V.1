import path from "node:path";
import { assert, detectRoots, read, walk } from "./_lib.mjs";
const { opsRoot }=detectRoots();const roots=[path.join(opsRoot,"components","ac-capital-os"),path.join(opsRoot,"lib","ac-capital-os"),path.join(opsRoot,"app","api","ac-capital-os")];const patterns=[/AIza[0-9A-Za-z_-]{20,}/,/sk-[A-Za-z0-9_-]{20,}/,/postgres(?:ql)?:\/\/[^\s"']+:[^\s"']+@/,/service_role_[A-Za-z0-9_-]{20,}/,/SUPABASE_DB_URL\s*=\s*["'][^"']+/];const failures=[];
for(const root of roots)for(const file of walk(root,f=>/\.(ts|tsx|js|mjs|md)$/.test(f))){const source=read(file);for(const pattern of patterns)if(pattern.test(source))failures.push(`${file}: ${pattern}`)}
assert(!failures.length,`possible secret leak:\n${failures.join("\n")}`);console.log("MZ15_NO_SECRET_LEAK_VERIFIED");
