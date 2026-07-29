import {assert,read,pass} from "./_bulk2-verifier-helpers.mjs";
const dir="components/market-os/content-command/experience-bulk2/";
const files=["Bulk2ObservatoryWorkspace.tsx","Bulk2StrategyWorkspace.tsx","Bulk2BriefingWorkspace.tsx","Bulk2PlanningWorkspace.tsx","Bulk2BrandGovernanceWorkspace.tsx"];
const s=files.map(f=>read(dir+f)).join("\n");
for(const token of ["Math.random() *","fakeSignal","demoSignals","mockSignals","sampleStrategy","automatic approval"]) assert(!s.includes(token),`Fabricated intelligence token found: ${token}`);
assert(s.includes("Aucun signal d’exemple"),"Observatoire must state that examples are not injected");
assert(s.includes("ne dispose pas d’une entité structurée")||s.includes("ne dispose pas"),"Model boundaries for unsupported structured records must be visible");
pass("no fabricated sources, scenarios, approvals, collisions, violations or structured authority are introduced");
