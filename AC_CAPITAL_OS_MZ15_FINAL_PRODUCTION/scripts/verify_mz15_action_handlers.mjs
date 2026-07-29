import path from "node:path";
import { assertIncludes, detectRoots } from "./_lib.mjs";
const { repoRoot, opsRoot }=detectRoots();
const checks=[
 ["radar/RadarPage.tsx","capital-radar/route.ts",["create-opportunity","validate-source","handoff","monitor"]],
 ["qualification/QualificationPage.tsx","qualification-engine/route.ts",["create-dossier","decision","missing-document","next-action"]],
 ["funders/FundersPage.tsx","funder-intelligence/route.ts",["create-funder","add-contact","relationship-event","objection","narrative","followup"]],
 ["doctrine/DoctrinePage.tsx","capital-doctrine/route.ts",["create-doctrine","create-prompt","create-skill","activate","rollback"]],
 ["cases/CasesPage.tsx","case-builder/route.ts",["create-case","add-section","request-proof","request-approval","handover","lock-version"]],
 ["pipeline/PipelinePage.tsx","capital-pipeline/route.ts",["create-deal","move-stage","communication","followup","submission","negotiation","outcome"]],
 ["coordinator/CoordinatorPage.tsx","coordinator-cockpit/route.ts",["create-task","call-log","escalation"]],
 ["ai-command/AiCommandPage.tsx","ai-command-center/route.ts",["pause-agent","approval-queue"]],
 ["strategy/StrategyPage.tsx","strategy-production-command/route.ts",["create-scenario","stress-test"]],
 ["learning/LearningPage.tsx","learning/route.ts",["capture-learning","convert-to-doctrine"]],
];
for(const [pageRel,apiRel,actions] of checks){const page=path.join(opsRoot,"components","ac-capital-os","pages",pageRel);const api=path.join(opsRoot,"app","api","ac-capital-os",apiRel);for(const action of actions){assertIncludes(page,action,repoRoot);assertIncludes(api,`\"${action}\"`,repoRoot)}}
for(const endpoint of ["data-room/upload/route.ts","coordinator-cockpit/email/prepare/route.ts","coordinator-cockpit/email/mark-sent/route.ts","coordinator-cockpit/workflow/complete-task/route.ts","ai-command-center/run/route.ts","ai-command-center/issue/route.ts","reports/generate/route.ts","approvals/[id]/decision/route.ts"]){assertIncludes(path.join(opsRoot,"app","api","ac-capital-os",endpoint),"export async function POST",repoRoot)}
console.log("MZ15_ACTION_HANDLER_PARITY_VERIFIED");
