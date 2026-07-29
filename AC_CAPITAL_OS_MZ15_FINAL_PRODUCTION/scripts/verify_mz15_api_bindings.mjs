import path from "node:path";
import { assertFile, assertIncludes, detectRoots } from "./_lib.mjs";
const { repoRoot, opsRoot } = detectRoots();
const bindings = {
  "command-floor":["/api/ac-capital-os/command-floor","/api/ac-capital-os/approvals","/api/ac-capital-os/reports/generate"],
  radar:["/api/ac-capital-os/capital-radar","/api/ac-capital-os/capital-radar/research/run"], qualification:["/api/ac-capital-os/qualification-engine"],
  funders:["/api/ac-capital-os/funder-intelligence"], doctrine:["/api/ac-capital-os/capital-doctrine"], cases:["/api/ac-capital-os/case-builder"],
  "data-room":["/api/ac-capital-os/data-room","/api/ac-capital-os/data-room/upload"], pipeline:["/api/ac-capital-os/capital-pipeline"],
  coordinator:["/api/ac-capital-os/coordinator-cockpit","/api/ac-capital-os/coordinator-cockpit/email/prepare","/api/ac-capital-os/coordinator-cockpit/email/mark-sent","/api/ac-capital-os/coordinator-cockpit/workflow/complete-task"],
  "ai-command":["/api/ac-capital-os/ai-command-center","/api/ac-capital-os/ai-command-center/run","/api/ac-capital-os/ai-command-center/issue"],
  strategy:["/api/ac-capital-os/strategy-production-command"], simulator:["/api/ac-capital-os/strategy-production-command"],
  reports:["/api/ac-capital-os/reports/list","/api/ac-capital-os/reports/generate"], manual:["/api/ac-capital-os/manual/progress","/api/ac-capital-os/strategy-production-command"],
  approvals:["/api/ac-capital-os/approvals"], learning:["/api/ac-capital-os/learning"], settings:["/api/ac-capital-os/settings"],
  production:["/api/ac-capital-os/production-health","/api/ac-capital-os/strategy-production-command"],
};
const componentByFolder = {"command-floor":"CommandFloorPage",radar:"RadarPage",qualification:"QualificationPage",funders:"FundersPage",doctrine:"DoctrinePage",cases:"CasesPage","data-room":"DataRoomPage",pipeline:"PipelinePage",coordinator:"CoordinatorPage","ai-command":"AiCommandPage",strategy:"StrategyPage",simulator:"SimulatorPage",reports:"ReportsPage",manual:"ManualPage",approvals:"ApprovalsPage",learning:"LearningPage",settings:"SettingsPage",production:"ProductionPage"};
for (const [folder, urls] of Object.entries(bindings)) {
  const file=path.join(opsRoot,"components","ac-capital-os","pages",folder,`${componentByFolder[folder]}.tsx`);
  for (const url of urls) { assertIncludes(file,url,repoRoot); const route=url.replace("/api/ac-capital-os/",""); assertFile(path.join(opsRoot,"app","api","ac-capital-os",...route.split("/"),"route.ts"),repoRoot); }
  assertIncludes(file,"envelope=",repoRoot);
}
console.log("MZ15_REAL_API_BINDINGS_VERIFIED");
