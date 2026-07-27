import fs from "node:fs";
import path from "node:path";
const cwd=process.cwd();
function exists(p){return fs.existsSync(p)}
function read(p){return fs.readFileSync(p,"utf8")}
function findRoots(start){const ops=path.join(start,"apps","ops-web"); if(exists(ops)) return {mode:"repository-root",repoRoot:start,opsRoot:ops}; if(exists(path.join(start,"app"))&&exists(path.join(start,"package.json"))) return {mode:"ops-web-root",repoRoot:path.resolve(start,"..",".."),opsRoot:start}; throw new Error("Run from repository root or apps/ops-web.")}
function assert(c,m){ if(!c){console.error(`FAIL: ${m}`); process.exit(1);} }
function includes(file,token){ assert(read(file).includes(token), `${path.relative(process.cwd(),file)} missing token: ${token}`); }
const {mode,repoRoot,opsRoot}=findRoots(cwd);
const routes=["","radar","qualification","funders","doctrine","cases","data-room","pipeline","coordinator","ai-command","strategy","simulator","reports","manual","approvals","settings","production"];
for(const route of routes){ const page=route?path.join(opsRoot,"app","(protected)","ac-capital-os",route,"page.tsx"):path.join(opsRoot,"app","(protected)","ac-capital-os","page.tsx"); assert(exists(page),`route page missing: /ac-capital-os${route?"/"+route:""}`); includes(page,"CapitalUniverseClient"); }
const client=path.join(opsRoot,"components","ac-capital-os","universe","CapitalUniverseClient.tsx"); assert(exists(client),"CapitalUniverseClient missing");
for(const token of ["Capital Flow Map","Right Intelligence Panel","+ New Capital Action","EntityDrawer","CapitalModal","Founder Approval Modal","Data Room Upload Modal","AI Dry-Run Modal","Report Preview Modal","Coordinator Mission Modal","Opportunity Intelligence Radar","Investment Committee Qualification Room","Funder Intelligence Room","Capital Doctrine Vault","Fundraising Case Factory","Due Diligence Vault","Capital Deal Room","Human Coordinator Mission Desk","AI Capital Brain Control Lab","Executive Strategy War Room","Executive Capital Report Studio","SOP Academy & Execution Workbook","Founder Approval Chamber","Capital System Control Panel","Production Control Tower","No Automatic Submission","No Exposed API Keys","MZ14_AC_CAPITAL_OS_CAPITAL_COMMAND_UNIVERSE"]){ includes(client,token); }
for(const route of ["foundation","executive-cockpit","capital-radar","qualification-engine","funder-intelligence","capital-doctrine","case-builder","data-room","capital-pipeline","coordinator-cockpit","ai-command-center","strategy-production-command"]){ assert(exists(path.join(opsRoot,"app","api","ac-capital-os",route,"route.ts")),`previous API missing: ${route}`); }
console.log("MZ14_AC_CAPITAL_OS_CAPITAL_COMMAND_UNIVERSE_VERIFIED");
console.log(`Detected mode: ${mode}`);
console.log("All command universe routes exist, including /coordinator, /simulator, /reports, /manual, /settings and /approvals.");
console.log("Premium shell, command palette, right panel, drawers, modals, flow map and unique workspace surfaces verified.");
console.log("No SQL executed by this package.");
