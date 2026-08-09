import {contains,pass} from "./_bulk2-verifier-helpers.mjs";
contains("components/market-os/content-command/experience-bulk1/Bulk1CommandementWorkspace.tsx",["useHeadquartersSnapshot","buildCommandViewModel","refresh"]);
contains("components/market-os/content-command/experience-bulk2/Bulk2ObservatoryWorkspace.tsx",["await refresh()"]);
contains("components/market-os/content-command/experience-bulk2/Bulk2StrategyWorkspace.tsx",["await refresh()"]);
pass("Headquarters-backed strategic mutations refresh the authoritative snapshot consumed by Commandement");
