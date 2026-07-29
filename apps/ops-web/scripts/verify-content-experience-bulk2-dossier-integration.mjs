import {contains,pass} from "./_bulk2-verifier-helpers.mjs";
const f="components/market-os/content-command/experience-bulk1/Bulk1DossierWorkspace.tsx";
contains(f,["/market-os/content-command-center/signals","/market-os/content-command-center/strategies","/market-os/content-command-center/briefs","/market-os/content-command-center/calendar","/market-os/content-command-center/brand-governance"]);
contains("components/market-os/content-command/experience-bulk2/bulk2-context.ts",["BULK1_STORAGE_KEY","dossierId","returnTo"]);
pass("Bulk 1 Dossier 360 specialist stages enter Bulk 2 with persistent dossier continuity");
