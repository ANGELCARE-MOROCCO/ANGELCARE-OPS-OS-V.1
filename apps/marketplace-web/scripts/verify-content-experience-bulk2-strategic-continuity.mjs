import {contains,pass} from "./_bulk2-verifier-helpers.mjs";
const f="components/market-os/content-command/experience-bulk2/bulk2-context.ts";
contains(f,["strategic-context.v1","bulk1.context.v1","strategicCaseId","dossier","returnTo","CustomEvent"]);
const shared="components/market-os/content-command/experience-bulk2/Bulk2Shared.tsx";
contains(shared,["StrategicIdentityStrip","StrategicContextSidecar","Observatoire","Fabrique","Briefing","Planning","Brand"]);
pass("strategic identity, dossier fallback and return continuity persist across all five workspaces");
