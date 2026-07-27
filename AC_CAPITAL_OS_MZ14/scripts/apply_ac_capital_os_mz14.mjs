import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const __filename = fileURLToPath(import.meta.url);
const packageRoot = path.resolve(path.dirname(__filename), "..");
const cwd = process.cwd();
function exists(p){ return fs.existsSync(p); }
function findRoots(start){ const ops=path.join(start,"apps","ops-web"); if(exists(ops)) return {mode:"repository-root",repoRoot:start,opsRoot:ops}; if(exists(path.join(start,"app"))&&exists(path.join(start,"package.json"))) return {mode:"ops-web-root",repoRoot:path.resolve(start,"..",".."),opsRoot:start}; throw new Error("Run from repository root or apps/ops-web."); }
function copyRecursive(src,dest){ const stat=fs.statSync(src); if(stat.isDirectory()){ fs.mkdirSync(dest,{recursive:true}); for(const e of fs.readdirSync(src)) copyRecursive(path.join(src,e),path.join(dest,e)); } else { fs.mkdirSync(path.dirname(dest),{recursive:true}); fs.copyFileSync(src,dest); } }
const {mode,repoRoot,opsRoot}=findRoots(cwd);
const backupDir=path.join(repoRoot,".angelcare_backups",`ac-capital-os-mz14-universe-${new Date().toISOString().replace(/[:.]/g,"-")}`);
fs.mkdirSync(backupDir,{recursive:true});
for(const rel of ["app/(protected)/ac-capital-os/page.tsx","components/ac-capital-os/universe/CapitalUniverseClient.tsx"]){ const file=path.join(opsRoot,rel); if(exists(file)){ fs.mkdirSync(path.dirname(path.join(backupDir,rel)),{recursive:true}); fs.copyFileSync(file,path.join(backupDir,rel)); } }
copyRecursive(path.join(packageRoot,"files","apps","ops-web"),opsRoot);
console.log("AC CAPITAL OS MZ14 Capital Command Universe UX installer");
console.log(`Detected mode: ${mode}`);
console.log(`Repository root: ${repoRoot}`);
console.log(`Ops-web root: ${opsRoot}`);
console.log(`Backup created at: ${path.relative(repoRoot,backupDir)}`);
console.log("Installed premium universe shell, all route pages, command palette, drawers, modals, right intelligence panel, flow map and workspace-specific visual surfaces.");
console.log("No SQL executed. No backend APIs destroyed. No Market OS touched.");
console.log("Next: node ./AC_CAPITAL_OS_MZ14/scripts/verify_ac_capital_os_mz14.mjs");
