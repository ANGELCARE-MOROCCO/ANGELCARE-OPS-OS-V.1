import {contains,pass} from "./_bulk2-verifier-helpers.mjs";
contains("components/market-os/content-command/experience-bulk2/Bulk2Shared.tsx",["aria-label","role=\"dialog\"","aria-modal=\"true\"","Escape","role=\"status\""]);
for(const f of ["Bulk2ObservatoryWorkspace.tsx","Bulk2StrategyWorkspace.tsx","Bulk2BriefingWorkspace.tsx","Bulk2PlanningWorkspace.tsx","Bulk2BrandGovernanceWorkspace.tsx"]) contains(`components/market-os/content-command/experience-bulk2/${f}`,["<main","aria-label"]);
contains("components/market-os/content-command/experience-bulk2/bulk2-experience.module.css",["prefers-reduced-motion","focus-visible"]);
pass("landmarks, dialogs, keyboard close, live notices, visible focus and reduced motion are present");
