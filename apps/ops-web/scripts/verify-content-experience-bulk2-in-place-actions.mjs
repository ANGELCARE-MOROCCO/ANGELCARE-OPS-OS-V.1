import {contains,pass} from "./_bulk2-verifier-helpers.mjs";
contains("components/market-os/content-command/experience-bulk2/Bulk2ObservatoryWorkspace.tsx",["qualifySelected","createSignal","runScan"]);
contains("components/market-os/content-command/experience-bulk2/Bulk2StrategyWorkspace.tsx",["createStrategy","compilePlan"]);
contains("components/market-os/content-command/experience-bulk2/Bulk2BriefingWorkspace.tsx",["saveSection","recordClarification","setBriefStatus"]);
contains("components/market-os/content-command/experience-bulk2/Bulk2PlanningWorkspace.tsx",["saveSchedule"]);
contains("components/market-os/content-command/experience-bulk2/Bulk2BrandGovernanceWorkspace.tsx",["addRule","recordException"]);
pass("normal strategic-stage work is executable in context across all five workspaces");
