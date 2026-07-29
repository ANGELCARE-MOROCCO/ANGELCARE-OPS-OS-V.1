import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
const dir=path.dirname(fileURLToPath(import.meta.url));
const scripts=["verify_mz15_all_routes.mjs","verify_mz15_dedicated_page_architecture.mjs","verify_mz15_no_generic_universe_regression.mjs","verify_mz15_api_bindings.mjs","verify_mz15_action_handlers.mjs","verify_mz15_schema_payload_compatibility.mjs","verify_mz15_modal_states.mjs","verify_mz15_drawer_specialization.mjs","verify_mz15_no_dead_buttons.mjs","verify_mz15_package_syntax.mjs","verify_mz15_no_secret_leak.mjs","verify_mz15_backend_preservation.mjs","verify_mz15_production_acceptance.mjs"];
for(const script of scripts){const result=spawnSync(process.execPath,[path.join(dir,script)],{stdio:"inherit",cwd:process.cwd()});if(result.status!==0)process.exit(result.status||1)}
console.log("MZ15_AC_CAPITAL_OS_FINAL_PRODUCTION_PACKAGE_STATICALLY_VERIFIED");
console.log("Next gates: apply SQL manually, run repository TypeScript, run authenticated browser acceptance and inspect all 18 separate screenshots.");
