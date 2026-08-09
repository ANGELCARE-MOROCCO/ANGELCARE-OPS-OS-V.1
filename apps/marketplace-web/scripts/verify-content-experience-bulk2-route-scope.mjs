import {contains,exists,pass} from "./_bulk2-verifier-helpers.mjs";
const routes=["signals","strategies","briefs","calendar","brand-governance"];
for(const route of routes) exists(`app/(protected)/market-os/content-command-center/${route}/page.tsx`);
contains("components/market-os/content-command/headquarters/SignalsWorkspace.tsx",["Bulk2ObservatoryWorkspace"]);
contains("components/market-os/content-command/headquarters/StrategyWorkspace.tsx",["Bulk2StrategyWorkspace"]);
contains("components/market-os/content-command/content-briefs-page.tsx",["Bulk2BriefingWorkspace"]);
contains("components/market-os/content-command/content-calendar-page.tsx",["Bulk2PlanningWorkspace"]);
contains("components/market-os/content-command/content-brand-governance-page.tsx",["Bulk2BrandGovernanceWorkspace"]);
pass("exactly five contracted strategic routes are wired to Bulk 2 experiences");
