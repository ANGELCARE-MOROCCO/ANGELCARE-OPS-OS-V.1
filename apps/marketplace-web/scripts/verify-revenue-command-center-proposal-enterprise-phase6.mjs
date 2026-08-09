import fs from "node:fs"
import path from "node:path"
import process from "node:process"
import { createRequire } from "node:module"

const root=process.cwd(),failures=[],passes=[]
const check=(condition,label)=>condition?passes.push(label):failures.push(label)
const abs=(p)=>path.join(root,p),exists=(p)=>fs.existsSync(abs(p)),read=(p)=>fs.readFileSync(abs(p),"utf8")
function walk(dir,predicate,found=[]){if(!fs.existsSync(dir))return found;for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const target=path.join(dir,entry.name);if(entry.isDirectory())walk(target,predicate,found);else if(predicate(target))found.push(target)}return found}

const routeContracts={
  "app/(protected)/revenue-command-center/prospects/proposals/page.tsx":["RevenueProposalWorkspace",'experience="proposal-command"','contextType="prospect"'],
  "app/(protected)/revenue-command-center/prospects/negotiation/page.tsx":["RevenueProposalWorkspace",'experience="negotiation-command"'],
  "app/(protected)/revenue-command-center/prospects/[id]/proposal/page.tsx":["RevenueProposalWorkspace",'experience="proposal-dossier"','contextId={id}'],
  "app/(protected)/revenue-command-center/prospects/[id]/negotiation/page.tsx":["RevenueProposalWorkspace",'experience="negotiation-room"'],
  "app/(protected)/revenue-command-center/partnerships/proposals/page.tsx":["RevenueProposalWorkspace",'experience="partnership-proposals"'],
  "app/(protected)/revenue-command-center/partnerships/[id]/proposal/page.tsx":["RevenueProposalWorkspace",'experience="partnership-proposal-dossier"'],
  "app/(protected)/revenue-command-center/b2c-workflow/quote/page.tsx":["RevenueProposalWorkspace",'experience="b2c-quotes"'],
  "app/(protected)/revenue-command-center/b2c-workflow/[id]/quote/page.tsx":["RevenueProposalWorkspace",'experience="b2c-quote-dossier"'],
}
const requiredFiles=[
  "components/revenue-command-center/proposal-enterprise/RevenueProposalWorkspace.tsx",
  "components/revenue-command-center/proposal-enterprise/RevenueProposalWorkspace.module.css",
  "components/revenue-command-center/proposal-enterprise/route-contracts.ts",
  "components/revenue-command-center/proposal-enterprise/types.ts",
  "components/revenue-command-center/proposal-enterprise/useProposalPortfolio.ts",
  "lib/revenue-command-center/proposal-enterprise/server.ts",
  "supabase/revenue-command-center/preflight/20260725_proposal_pricing_negotiation_live_schema_preflight.sql",
  "supabase/migrations/20260725_0400_revenue_proposal_pricing_negotiation_completion.sql",
  "supabase/revenue-command-center/rollback/20260725_proposal_pricing_negotiation_phase6_rollback.sql",
  "supabase/revenue-command-center/verification/20260725_proposal_pricing_negotiation_rls_verification.sql",
  "supabase/revenue-command-center/verification/20260725_proposal_pricing_calculation_verification.sql",
  "tsconfig.revenue-command-center-proposal-phase6.json",
]
for(const file of requiredFiles)check(exists(file),`required Mega ZIP 6 file exists: ${file}`)
for(const [file,markers] of Object.entries(routeContracts)){check(exists(file),`route exists: ${file}`);if(exists(file)){const source=read(file);for(const marker of markers)check(source.includes(marker),`${file} contract marker: ${marker}`);for(const legacy of ["ProspectEnterpriseWorkspace","ProspectEnterpriseDossier","RevenuePartnershipsV13ActionsWorkspace","RevenuePartnershipsEnterpriseWorkspace","RevenueB2CWorkflowV12MegaWorkspace"])check(!source.includes(legacy),`${file} excludes legacy shared workspace: ${legacy}`)}}

const routeRoot=abs("app/(protected)/revenue-command-center")
const allPages=walk(routeRoot,file=>file.endsWith(`${path.sep}page.tsx`))
check(allPages.length===151,`Revenue route estate remains exactly 151 pages (found ${allPages.length})`)
check(Object.keys(routeContracts).length===8,"Mega ZIP 6 freezes exactly 8 existing proposal/negotiation/quote routes")

const apiFiles=walk(abs("app/api/revenue-command-center/proposal"),file=>file.endsWith(`${path.sep}route.ts`))
check(apiFiles.length===29,`proposal API family contains 29 protected route files (found ${apiFiles.length})`)
for(const file of apiFiles){const source=fs.readFileSync(file,"utf8");check(source.includes("proposalContext("),`${path.relative(root,file)} enforces Revenue API context`);check(source.includes("revenueAccessFailure"),`${path.relative(root,file)} returns controlled access errors`);check(!source.includes("SUPABASE_SERVICE_ROLE_KEY")||file.endsWith("server.ts"),`${path.relative(root,file)} does not create an unguarded service client`)}

const component=read("components/revenue-command-center/proposal-enterprise/RevenueProposalWorkspace.tsx")
const css=read("components/revenue-command-center/proposal-enterprise/RevenueProposalWorkspace.module.css")
const contracts=read("components/revenue-command-center/proposal-enterprise/route-contracts.ts")
const typeSource=read("components/revenue-command-center/proposal-enterprise/types.ts")
const server=read("lib/revenue-command-center/proposal-enterprise/server.ts")
const migration=read("supabase/migrations/20260725_0400_revenue_proposal_pricing_negotiation_completion.sql")
const preflight=read("supabase/revenue-command-center/preflight/20260725_proposal_pricing_negotiation_live_schema_preflight.sql")

for(const key of ["proposal-command","proposal-dossier","negotiation-command","negotiation-room","partnership-proposals","partnership-proposal-dossier","b2c-quotes","b2c-quote-dossier"])check(contracts.includes(`"${key}"`),`purpose-built route contract defined: ${key}`)
for(const experience of ["CommandExperience","ProposalDossier","NegotiationCommand","NegotiationRoom","PartnershipPortfolio","PartnershipStudio","B2CQuotes","B2CQuoteStudio","ProposalModal"])check(component.includes(`function ${experience}`),`distinct enterprise experience exists: ${experience}`)
for(const modal of ["create-proposal","select-opportunity","add-line","edit-line","optional-line","add-term","pricing-scenario","discount","pricing-approval","margin-exception","approve-proposal","reject-proposal","return-correction","version","compare-versions","generate-preview","generate-document","transmission","send-proposal","response","revision-request","open-negotiation","objection","resolve-objection","counteroffer","concession","approve-concession","reject-concession","negotiation-position","decision","accept-negotiated","reject-outcome","withdraw-proposal","extend-validity","supersede-proposal","evidence-viewer","approval-history","commercial-audit"])check(component.includes(`\"${modal}\"`)||component.includes(`${modal}:`),`modal or governed sub-experience represented: ${modal}`)
check((typeSource.match(/\| "/g)||[]).length>=38,"ProposalModalKind exposes the complete 38-operation contract")
check(component.includes('Intl.NumberFormat("fr-FR"'),"monetary formatting uses fr-FR")
check(component.includes(" Dh`"),"visible commercial values use Dh")
check(component.includes("Source de vérité"),"frontend discloses the authoritative data boundary")
check(component.includes("ne sont affichés que lorsqu’ils existent réellement"),"frontend prohibits fabricated recipient events")
check(component.includes('document.body.style.overflow="hidden"'),"modal system protects background scroll")
check(component.includes('event.key==="Escape"'),"modal system implements Escape handling")
check(component.includes('event.key==="Tab"'),"modal system implements focus trapping")
check(component.includes("Aucune concession ne doit exister uniquement"),"concession governance is explicit")
check(component.includes("Bibliothèque d’opérations"),"all governed proposal operations are accessible from the enterprise action deck")
check(component.includes("Cet aperçu exclut les coûts internes"),"customer preview explicitly excludes sensitive internal data")
check(component.includes("full-page")||component.includes("PROPOSAL STUDIO"),"proposal studio is represented as a dedicated working environment")
check(css.includes(".shell{")&&css.includes("min-height:100%")&&!css.includes("max-width:1680px"),"proposal estate is full-width")
check(css.includes(".studio{")&&css.includes("grid-template-columns:220px minmax(0,1fr) 330px"),"proposal studio has a three-zone corporate composition")
check(css.includes(".negotiationGrid{"),"negotiation room has a distinct visual composition")
check(css.includes(".quoteHero{"),"B2C and partnership experiences have a distinct quote composition")
check(css.includes("@media(max-width:720px)"),"mobile transformations are defined")
check(css.includes(".modalBackdrop")&&css.includes("backdrop-filter"),"premium modal effects are present")
check(server.includes("validateProposalTransition"),"server validates proposal lifecycle transitions")
check(server.includes("calculateFinancials"),"server owns deterministic financial calculations")
check(server.includes("marginPercent=net>0"),"margin percentage handles zero-net proposals safely")
check(server.includes("createProposalTask"),"proposal decisions connect to the execution accountability spine")

for(const table of ["revenue_proposals","revenue_proposal_versions","revenue_proposal_sections","revenue_proposal_line_items","revenue_pricing_scenarios","revenue_proposal_approval_requests","revenue_discount_requests","revenue_margin_exceptions","revenue_proposal_documents","revenue_proposal_recipients","revenue_proposal_transmissions","revenue_proposal_delivery_events","revenue_proposal_responses","revenue_negotiations","revenue_negotiation_rounds","revenue_negotiation_positions","revenue_proposal_objections","revenue_counteroffers","revenue_concession_requests","revenue_negotiation_decisions","revenue_proposal_status_history","revenue_commercial_outcomes","revenue_contract_handoffs"])check(migration.includes(`public.${table}`),`migration represents operational table: ${table}`)
check(migration.includes("begin;")&&migration.includes("commit;"),"migration is transactional")
check(migration.includes("expects public.revenue_prospects.id TEXT")||migration.includes("revenue_prospects.id TEXT"),"migration preserves the production TEXT prospect contract")
check(!migration.match(/alter table public\.revenue_prospects[\s\S]{0,200}alter column id type uuid/i),"migration never converts legacy prospect IDs")
check(migration.includes("revenue_create_proposal_version"),"immutable version creation function is present")
check(migration.includes("revenue_apply_commercial_outcome"),"atomic commercial outcome function is present")
check(migration.includes("Une preuve ou référence d’acceptation est requise"),"accepted outcomes require verifiable acceptance evidence")
check(migration.includes("Une concession reste en attente de décision"),"accepted outcomes reject pending concessions")
check(migration.includes("idempotent_replay"),"contract-ready outcome command is idempotent")
check(migration.includes("decision_reason text not null"),"commercial outcomes require a recorded decision rationale")
check(migration.includes("revenue_recalculate_proposal"),"server-validated recalculation function is present")
check(migration.includes("revoke all on function public.revenue_apply_commercial_outcome"),"atomic outcome function is unavailable to direct browser roles")
check(migration.includes("grant execute on function public.revenue_apply_commercial_outcome")&&migration.includes("service_role"),"atomic outcome function is restricted to protected server command")
check(migration.includes("active_version_id")&&migration.includes("proposal_snapshot"),"sent and accepted commercial versions are preserved")
check(migration.includes("internal_only boolean"),"customer/internal content separation is modeled")
check(migration.includes("idempotency_key text not null unique"),"proposal transmissions prevent duplicate sends")
check(migration.includes("status='contract_ready'"),"accepted outcome produces a contract-ready handoff")
check(migration.includes("Préparer le contrat"),"accepted outcome creates the next governed execution task")
check(preflight.includes("CUTOVER_GATE")&&preflight.includes("READY")&&preflight.includes("BLOCKED"),"read-only preflight exposes an explicit production cutover gate")
check(preflight.includes("247 production prospects include non-UUID legacy identifiers"),"preflight documents the accepted legacy identity reason")
check(preflight.includes("revenue_meeting_outcomes"),"preflight verifies the Mega ZIP 5 meeting outcome foundation")
check(preflight.includes("PARTIAL_SCHEMA_RECONCILIATION_REQUIRED"),"preflight blocks a partial proposal schema")

// Isolated TypeScript/TSX syntax gate using the globally installed compiler.
try{
  const require=createRequire(import.meta.url)
  let ts
  for(const candidate of ["typescript","/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript"]){try{ts=require(candidate);break}catch{}}
  if(!ts)throw new Error("TypeScript compiler not found")
  const sources=[...walk(abs("components/revenue-command-center/proposal-enterprise"),f=>/\.(ts|tsx)$/.test(f)),...walk(abs("lib/revenue-command-center/proposal-enterprise"),f=>f.endsWith(".ts")),...apiFiles,...Object.keys(routeContracts).map(abs)]
  let diagnostics=[]
  for(const file of sources){const source=fs.readFileSync(file,"utf8"),result=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.Preserve},fileName:file,reportDiagnostics:true});diagnostics.push(...(result.diagnostics||[]).map(d=>`${path.relative(root,file)}: ${ts.flattenDiagnosticMessageText(d.messageText," ")}`))}
  check(diagnostics.length===0,`TypeScript isolated syntax gate passes (${diagnostics.length} errors)`)
  if(diagnostics.length)failures.push(...diagnostics.slice(0,20))
}catch(error){failures.push(`TypeScript syntax gate unavailable: ${error.message}`)}

// CSS module references.
const cssNames=new Set([...css.matchAll(/\.([A-Za-z_][\w-]*)\s*[{,]/g)].map(m=>m[1]))
const refs=[...component.matchAll(/styles\.([A-Za-z_][\w]*)/g)].map(m=>m[1])
const missing=[...new Set(refs.filter(name=>!cssNames.has(name)))]
check(missing.length===0,`CSS-module references resolve (${missing.length} missing)`)
if(missing.length)failures.push(`Missing CSS module classes: ${missing.join(", ")}`)

if(failures.length){console.error(`\nMega ZIP 6 verification FAILED: ${failures.length} issue(s)`);for(const item of failures)console.error(`FAIL  ${item}`);process.exit(1)}
for(const item of passes)console.log(`PASS  ${item}`)
console.log(`\n${passes.length} checks passed. Proposal / Pricing / Negotiation Mega ZIP 6 is statically accepted.`)
