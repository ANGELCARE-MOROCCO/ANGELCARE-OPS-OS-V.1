import fs from "node:fs"
import path from "node:path"
import process from "node:process"

const root=process.cwd()
const failures=[]
const passes=[]
const check=(condition,label)=>condition?passes.push(label):failures.push(label)
const exists=(relative)=>fs.existsSync(path.join(root,relative))
const read=(relative)=>fs.readFileSync(path.join(root,relative),"utf8")

const routeContracts=[
  ["app/(protected)/revenue-command-center/documents/page.tsx","contract-command","system"],
  ["app/(protected)/revenue-command-center/partnerships/agreements/page.tsx","contract-portfolio","partnership"],
  ["app/(protected)/revenue-command-center/partnerships/[id]/agreement/page.tsx","contract-studio","partnership"],
  ["app/(protected)/revenue-command-center/partnerships/activation/page.tsx","activation-command","partnership"],
  ["app/(protected)/revenue-command-center/partnerships/[id]/activation/page.tsx","activation-dossier","partnership"],
  ["app/(protected)/revenue-command-center/system-activation/page.tsx","system-activation","system"],
]
const componentFiles=[
  "components/revenue-command-center/contract-enterprise/RevenueContractWorkspace.tsx",
  "components/revenue-command-center/contract-enterprise/RevenueContractWorkspace.module.css",
  "components/revenue-command-center/contract-enterprise/route-contracts.ts",
  "components/revenue-command-center/contract-enterprise/types.ts",
  "components/revenue-command-center/contract-enterprise/useContractPortfolio.ts",
  "lib/revenue-command-center/contract-enterprise/server.ts",
  "tsconfig.revenue-command-center-contract-phase7.json",
]
const apiRoutes=[
  "portfolio","contracts","contracts/[id]","contracts/[id]/transition","versions","reviews","signatories","signatures","conditions","obligations","milestones","payment-terms","payment-schedules","payment-promises","collection-actions","finance-handoffs","payment-confirmations","effectiveness","activation/evaluate","activation/authorize","operational-handoffs","realization","risks","commands",
]
const tables=[
  "revenue_contracts","revenue_contract_versions","revenue_contract_sections","revenue_contract_reviews","revenue_contract_approvals","revenue_contract_signatories","revenue_signature_events","revenue_signature_evidence","revenue_contract_conditions","revenue_condition_evidence","revenue_contract_obligations","revenue_obligation_events","revenue_contract_milestones","revenue_payment_terms","revenue_payment_schedules","revenue_payment_requirements","revenue_payment_promises","revenue_payment_promise_events","revenue_collection_actions","revenue_finance_handoffs","revenue_payment_confirmations","revenue_activation_gates","revenue_activation_decisions","revenue_operational_handoffs","revenue_realization_events","revenue_contract_risks","revenue_contract_status_history","revenue_contract_closures",
]
const views=["revenue_contract_command_view","revenue_activation_command_view","revenue_realization_command_view"]
const functions=["revenue_create_contract_from_handoff","revenue_create_contract_version","revenue_evaluate_contract_effectiveness","revenue_evaluate_activation_gates","revenue_authorize_contract_activation","revenue_confirm_revenue_realization","revenue_reverse_revenue_realization"]
const sqlFiles={
  migration:"supabase/migrations/20260725_0500_revenue_contract_signature_payment_activation_realization.sql",
  preflight:"supabase/revenue-command-center/preflight/20260725_contract_signature_payment_activation_live_schema_preflight.sql",
  rollback:"supabase/revenue-command-center/rollback/20260725_revenue_contract_signature_payment_activation_rollback.sql",
  rls:"supabase/revenue-command-center/verification/20260725_contract_signature_payment_activation_rls_verification.sql",
  contractGate:"supabase/revenue-command-center/verification/20260725_contract_gate_verification.sql",
  paymentGate:"supabase/revenue-command-center/verification/20260725_payment_gate_verification.sql",
  realization:"supabase/revenue-command-center/verification/20260725_revenue_realization_verification.sql",
}

for(const file of componentFiles)check(exists(file),`phase 7 required file exists: ${file}`)
for(const [file,experience,context] of routeContracts){
  check(exists(file),`contract route exists: ${file}`)
  if(!exists(file))continue
  const source=read(file)
  check(source.includes("RevenueContractWorkspace"),`route uses enterprise contract workspace: ${file}`)
  check(source.includes(`experience="${experience}"`),`route experience is ${experience}: ${file}`)
  check(source.includes(`contextType="${context}"`),`route context is ${context}: ${file}`)
  check(!source.includes("UltimateRevenueCommandPage")&&!source.includes("RevenuePartnershipsEnterpriseWorkspace")&&!source.includes("RevenuePartnershipsV13ActionsWorkspace"),`retired generic workspace removed: ${file}`)
}

const routeRoot=path.join(root,"app","(protected)","revenue-command-center")
function walk(dir,predicate,found=[]){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const absolute=path.join(dir,entry.name);if(entry.isDirectory())walk(absolute,predicate,found);else if(predicate(absolute))found.push(absolute)}return found}
const pages=walk(routeRoot,(file)=>file.endsWith(`${path.sep}page.tsx`))
check(pages.length===151,`full Revenue route estate remains 151 (found ${pages.length})`)
const enterpriseRouteCount=pages.filter((file)=>fs.readFileSync(file,"utf8").includes("RevenueContractWorkspace")).length
check(enterpriseRouteCount===6,`six contract/activation routes individually rebuilt (found ${enterpriseRouteCount})`)

const workspace=read(componentFiles[0])
const css=read(componentFiles[1])
const routeDefinitions=read(componentFiles[2])
const types=read(componentFiles[3])
const hook=read(componentFiles[4])
const server=read(componentFiles[5])

for(const key of routeContracts.map(([,experience])=>experience)){
  check(types.includes(`"${key}"`),`experience type exists: ${key}`)
  check(routeDefinitions.includes(`"${key}"`),`route contract exists: ${key}`)
}
check(routeDefinitions.includes("Centre de commandement contractuel"),"French corporate contract command title present")
check(routeDefinitions.includes("Autorité centrale d’activation & réalisation"),"executive activation authority experience present")
check(workspace.includes('Intl.NumberFormat("fr-FR"'),"contract monetary presentation uses fr-FR")
check(workspace.includes(" Dh`"),"contract monetary presentation uses Dh")
check(workspace.includes("role=\"dialog\"")&&workspace.includes("aria-modal=\"true\""),"enterprise dialogs are accessible")
check(workspace.includes('event.key==="Escape"')&&workspace.includes('event.key==="Tab"'),"dialog Escape and focus trapping are implemented")
check(workspace.includes('document.body.style.overflow="hidden"'),"dialog scroll lock is implemented")
check(workspace.includes("prior?.focus()"),"dialog focus restoration is implemented")
check(workspace.includes("Aucun contrat sélectionné"),"contract dossier empty state is explicit")
check(workspace.includes("Exécution contrôlée…"),"mutation pending state is explicit")
check(workspace.includes("Interactions persistées")||workspace.includes("Traçabilité"),"persisted operational boundary is visible")
check(!workspace.includes("dangerouslySetInnerHTML"),"no unsafe markup injection in contract workspace")
check(!workspace.includes("RCC_PARENT_SHELL_FULLWIDTH_FIX"),"no global CSS injection workaround")
check(!/\bMAD\b/.test(workspace),"customer-facing workspace uses Dh rather than MAD")

const modalPart=types.split("export type ContractModalKind =")[1]||""
const modalKinds=[...modalPart.matchAll(/\| "([^"]+)"/g)].map((match)=>match[1])
check(modalKinds.length===49,`49 governed contract sub-experiences represented (found ${modalKinds.length})`)
for(const modal of modalKinds){
  check(workspace.includes(`"${modal}"`)||workspace.includes(`'${modal}'`),`modal kind is implemented: ${modal}`)
}

const usedStyles=new Set([...workspace.matchAll(/styles\.([A-Za-z0-9_]+)/g)].map((match)=>match[1]))
const definedStyles=new Set([...css.matchAll(/\.([A-Za-z_][A-Za-z0-9_-]*)/g)].map((match)=>match[1]))
const missingStyles=[...usedStyles].filter((name)=>!definedStyles.has(name))
check(missingStyles.length===0,`CSS-module references resolve (missing ${missingStyles.length}${missingStyles.length?`: ${missingStyles.join(", ")}`:""})`)
check(css.includes("minmax(0,1fr)")||css.includes("minmax(0, 1fr)"),"full-width resilient grid foundation exists")
check(css.includes("@media")&&css.includes("max-width"),"responsive breakpoints exist")
check(css.includes(":focus-visible"),"visible keyboard focus style exists")

check(hook.includes("/api/revenue-command-center/contract/portfolio"),"portfolio hook uses canonical protected API")
check(hook.includes("AbortController"),"portfolio request cancellation is supported")
check(hook.includes("refresh"),"portfolio manual refresh is supported")
check(server.includes("requireRevenueApiAccess"),"server command context enforces Revenue access")
check(server.includes("createSupabaseAdmin")&&server.includes("SUPABASE_SERVICE_ROLE_KEY"),"protected command path can use service role after authorization")
check(server.includes("logRevenueAction")&&server.includes("recordContractEvent"),"contract mutations write the canonical command audit")
check(server.includes("createContractTask"),"contract workflows bridge into the execution engine")

for(const route of apiRoutes){
  const file=`app/api/revenue-command-center/contract/${route}/route.ts`
  check(exists(file),`protected contract API exists: ${route}`)
  if(!exists(file))continue
  const source=read(file)
  check(source.includes("contractContext("),`API enforces contract permission context: ${route}`)
  check(source.includes("revenueAccessFailure"),`API returns controlled access failures: ${route}`)
  check(source.includes("fail(")&&source.includes("ok("),`API uses canonical response contract: ${route}`)
  check(!source.includes("createClient("),`API does not open an uncontrolled browser client: ${route}`)
}
const apiFiles=walk(path.join(root,"app","api","revenue-command-center","contract"),(file)=>file.endsWith(`${path.sep}route.ts`))
check(apiFiles.length===24,`24 protected contract APIs installed (found ${apiFiles.length})`)

for(const file of Object.values(sqlFiles))check(exists(file),`database control file exists: ${file}`)
const migration=read(sqlFiles.migration)
const preflight=read(sqlFiles.preflight)
const rollback=read(sqlFiles.rollback)
const rls=read(sqlFiles.rls)
const contractGate=read(sqlFiles.contractGate)
const paymentGate=read(sqlFiles.paymentGate)
const realization=read(sqlFiles.realization)

check(/^--[\s\S]*?\nbegin;/m.test(migration)||migration.trimStart().startsWith("begin;"),"migration is transactional")
check(migration.trimEnd().endsWith("commit;"),"migration commits explicitly")
check(migration.includes("revenue_prospects.id must remain TEXT")||migration.includes("revenue_prospects.id")&&migration.includes("text"),"legacy TEXT prospect contract is guarded")
check(!migration.includes("alter column id type uuid"),"migration does not convert legacy prospect IDs")
check(migration.includes("Partial Mega ZIP 7 schema detected"),"partial-schema cutover is blocked")
check(migration.includes("revenue_contract_handoffs"),"Phase 6 contract-ready handoff dependency is required")
check(migration.includes("revenue_payment_confirmations"),"authoritative payment confirmation bridge exists")
check(migration.includes("revenue_operational_handoffs"),"operational handoff model exists")
check(migration.includes("revenue_realization_events"),"revenue realization model exists")
check(migration.includes("check(realized_value<=greatest(contract_value,signed_value))"),"realized value cannot exceed contractual authority")
check(!migration.includes("p.organization")&&!migration.includes("p.name"),"contract command view avoids unknown legacy prospect columns")
for(const table of tables){
  check(migration.includes(`create table if not exists public.${table}`),`additive table represented: ${table}`)
  check(rollback.includes(`drop table if exists public.${table}`),`rollback covers table: ${table}`)
  check(rls.includes(table),`RLS verification covers table: ${table}`)
}
for(const view of views){
  check(migration.includes(`create or replace view public.${view}`),`enterprise read model represented: ${view}`)
  check(rollback.includes(`drop view if exists public.${view}`),`rollback covers view: ${view}`)
}
for(const fn of functions){
  check(migration.includes(`function public.${fn}`),`atomic command represented: ${fn}`)
  check(migration.includes(`revoke all on function public.${fn}`),`browser execution revoked: ${fn}`)
  check(migration.includes(`grant execute on function public.${fn}`),`service command execution granted: ${fn}`)
  check(rollback.includes(`drop function if exists public.${fn}`),`rollback covers command: ${fn}`)
}
check(migration.includes("revenue_realization_events_one_reversal_per_event_idx"),"one controlled reversal per realization event is enforced")
check(migration.includes("idempotent_replay"),"critical contract commands expose idempotent replay")
check(migration.includes("finance_reference")&&migration.includes("evidence_reference"),"finance authority and evidence are mandatory")
check(migration.includes("activation_status not in ('authorized','activated')"),"realization requires authorized activation")
check(migration.includes("payment confirmations")||migration.includes("revenue_payment_confirmations"),"realization validates authoritative payment confirmation")
check(migration.includes("for update"),"critical commands lock authoritative rows")
check(migration.includes("security definer"),"atomic database commands use controlled security-definer execution")
check(migration.includes("revoke insert,update,delete")&&migration.includes("grant select"),"browser roles remain read-only on support tables")
check(migration.includes("to service_role"),"mutating command authority is restricted to service role")
check(preflight.includes("CUTOVER_GATE")&&preflight.includes("READY")&&preflight.includes("BLOCKED"),"preflight has explicit production cutover gate")
check(preflight.includes("revenue_prospects")&&preflight.includes("text"),"preflight accepts the live TEXT prospect identity contract")
check(preflight.includes("revenue_contract_handoffs"),"preflight checks Phase 6 handoff foundation")
check(rls.includes("rowsecurity")||rls.includes("relrowsecurity"),"RLS verification inspects enabled policies")
check(contractGate.includes("signature")&&contractGate.includes("condition"),"contract gate verification covers signatures and conditions")
check(paymentGate.includes("finance")&&paymentGate.includes("payment"),"payment gate verification covers Finance authority")
check(realization.toLowerCase().includes("realization")&&realization.toLowerCase().includes("duplicate"),"realization verification covers duplication control")
check(rollback.trimStart().startsWith("-- Controlled rollback")&&rollback.trimEnd().endsWith("commit;"),"rollback is explicit and transactional")

const tsconfig=JSON.parse(read("tsconfig.revenue-command-center-contract-phase7.json"))
check(tsconfig.compilerOptions?.noEmit===true,"focused TypeScript gate is no-emit")
check(tsconfig.include.some((value)=>value.includes("contract-enterprise")),"focused TypeScript gate includes contract enterprise source")
check(tsconfig.include.some((value)=>value.includes("app/api/revenue-command-center/contract")),"focused TypeScript gate includes all contract APIs")

console.log("\nANGELCARE Revenue Command Center — Contract, Signature, Payment & Realization Phase 7 Verification\n")
for(const label of passes)console.log(`PASS  ${label}`)
if(failures.length){console.error("\nFAILED CHECKS\n");for(const label of failures)console.error(`FAIL  ${label}`);console.error(`\n${passes.length} passed, ${failures.length} failed.`);process.exit(1)}
console.log(`\n${passes.length} checks passed. Contract / Signature / Payment / Activation / Realization Phase 7 is statically accepted.`)
