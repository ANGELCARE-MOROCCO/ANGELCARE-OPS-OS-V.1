import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const here=path.dirname(fileURLToPath(import.meta.url));
const packageRoot=path.resolve(here,".."); const payloadRoot=path.join(packageRoot,"payload");
const cwd=process.cwd(); const repoRoot=fs.existsSync(path.join(cwd,"apps","ops-web"))?cwd:fs.existsSync(path.join(cwd,"..","apps","ops-web"))?path.resolve(cwd,".."):null;
if(!repoRoot) throw new Error("Run from AngelCare repository root.");
const files=["apps/ops-web/app/api/ac-capital-os/orchestrator/route.ts", "apps/ops-web/app/api/ac-capital-os/orchestrator/tick/route.ts", "apps/ops-web/app/(protected)/ac-capital-os/orchestrator/page.tsx", "apps/ops-web/components/ac-capital-os/core/navigation.ts", "apps/ops-web/components/ac-capital-os/pages/orchestrator/OrchestratorPage.tsx", "apps/ops-web/components/ac-capital-os/pages/orchestrator/orchestrator.module.css", "apps/ops-web/lib/ac-capital-os/server/capital-orchestrator.ts", "supabase/migrations/20260729_ac_capital_os_final_ai_operated_department_mega_07.sql"]; const stamp=new Date().toISOString().replace(/[:.]/g,"-"); const backup=path.join(repoRoot,".angelcare_backups","ac-capital-final-mega-07-"+stamp);
let installed=0; for(const rel of files){const src=path.join(payloadRoot,rel),dst=path.join(repoRoot,rel);fs.mkdirSync(path.dirname(dst),{recursive:true});if(fs.existsSync(dst)){const b=path.join(backup,rel);fs.mkdirSync(path.dirname(b),{recursive:true});fs.copyFileSync(dst,b);}fs.copyFileSync(src,dst);installed++;}
console.log("AC_CAPITAL_OS_FINAL_AI_OPERATED_DEPARTMENT_MEGA_07_INSTALLED"); console.log(`Files installed: ${installed}`); console.log(`Backup: ${path.relative(repoRoot,backup)}`); console.log("SQL copied but NOT executed: supabase/migrations/20260729_ac_capital_os_final_ai_operated_department_mega_07.sql"); console.log("No TypeScript, build, SQL, Git, provider request, commit, push or deployment was performed.");
