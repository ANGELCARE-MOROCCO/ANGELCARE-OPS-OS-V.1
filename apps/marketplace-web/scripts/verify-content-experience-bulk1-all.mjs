import { spawnSync } from "node:child_process"
import path from "node:path"
const scripts=[
"verify-content-experience-bulk1-route-scope.mjs",
"verify-content-experience-bulk1-commandement.mjs",
"verify-content-experience-bulk1-my-work.mjs",
"verify-content-experience-bulk1-dossier360.mjs",
"verify-content-experience-bulk1-context-continuity.mjs",
"verify-content-experience-bulk1-lifecycle-actions.mjs",
"verify-content-experience-bulk1-data-synchronization.mjs",
"verify-content-experience-bulk1-no-generic-anatomy.mjs",
"verify-content-experience-bulk1-no-fabricated-state.mjs",
"verify-content-experience-bulk1-css-purity.mjs",
"verify-content-experience-bulk1-accessibility.mjs",
"verify-content-experience-bulk1-responsive.mjs",
"verify-content-experience-bulk1-backend-boundaries.mjs",
"verify-content-experience-bulk1-portability.mjs",
"verify-content-experience-bulk1-preservation.mjs",
]
for(const script of scripts){const result=spawnSync(process.execPath,[path.join(import.meta.dirname,script)],{stdio:"inherit",env:process.env});if(result.status!==0)process.exit(result.status||1)}
console.log(`PASS — ${scripts.length}/${scripts.length} Bulk 1 contractual verifiers completed`)
