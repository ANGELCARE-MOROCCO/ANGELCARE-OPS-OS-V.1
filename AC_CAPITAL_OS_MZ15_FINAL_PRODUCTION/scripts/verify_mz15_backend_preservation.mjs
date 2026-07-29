import path from "node:path";
import { assertFile, assertIncludes, detectRoots } from "./_lib.mjs";
const { repoRoot, opsRoot }=detectRoots();
for(const route of ["foundation","executive-cockpit","capital-radar","qualification-engine","funder-intelligence","capital-doctrine","case-builder","data-room","capital-pipeline","coordinator-cockpit","ai-command-center","strategy-production-command"]){assertFile(path.join(opsRoot,"app","api","ac-capital-os",route,"route.ts"),repoRoot)}
for(const file of ["supabase.ts","repository.ts","ai-provider-bridge.ts","ai-runner.ts","research-adapter.ts","storage.ts","reports.ts","automation-gates.ts","approval-guard.ts","permissions.ts","mz15-api.ts","actor-context.ts"]){assertFile(path.join(opsRoot,"lib","ac-capital-os","server",file),repoRoot)}
assertIncludes(path.join(opsRoot,"components","ac-capital-os","pages","coordinator","CoordinatorPage.tsx"),"No Automatic Sending",repoRoot);
assertIncludes(path.join(opsRoot,"components","ac-capital-os","pages","ai-command","AiCommandPage.tsx"),"No live model by default",repoRoot);
console.log("MZ15_BACKEND_AND_SAFETY_BOUNDARIES_PRESERVED");
