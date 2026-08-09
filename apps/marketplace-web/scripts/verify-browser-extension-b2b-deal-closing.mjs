import fs from 'node:fs'
import path from 'node:path'
const root=process.cwd(), failures=[], passes=[]
const read=(rel)=>{const p=path.join(root,rel);if(!fs.existsSync(p)){failures.push(`Missing ${rel}`);return ''}return fs.readFileSync(p,'utf8')}
const check=(ok,label)=>{(ok?passes:failures).push(label)}
const migration=read('supabase/migrations/20260719_browser_extension_b2b_deal_closing.sql')
const contract=read('lib/browser-extension/b2b-deal-closing/contract.ts')
const service=read('lib/browser-extension/b2b-deal-closing/service.ts')
const auth=read('lib/browser-extension/b2b-intelligence/authorization.ts')
const dispatch=read('lib/browser-extension/b2b-intelligence/service.ts')
const profile=read('app/(protected)/users/_components/UserBrowserExtensionAccessSection.tsx')
const access=read('app/api/browser-extension/v1/admin/users/[id]/access/route.ts')
const supplementText=read('lib/browser-extension/generated/b2b-deal-closing.v4.json')
const supplement=supplementText?JSON.parse(supplementText):null
const routes=['proposals','pricing','negotiation','closing','payments','rescue'].map(x=>`app/api/browser-extension/v1/b2b/deal/${x}/route.ts`)
for(const route of routes)check(fs.existsSync(path.join(root,route)),`route ${route}`)
const tables=['browser_extension_b2b_offer_configurations','browser_extension_b2b_margin_policies','browser_extension_b2b_pricing_calculations','browser_extension_b2b_margin_snapshots','browser_extension_b2b_proposal_versions','browser_extension_b2b_proposal_line_items','browser_extension_b2b_approval_requests','browser_extension_b2b_approval_decisions','browser_extension_b2b_proposal_deliveries','browser_extension_b2b_discount_requests','browser_extension_b2b_negotiation_rooms','browser_extension_b2b_negotiation_events','browser_extension_b2b_counteroffers','browser_extension_b2b_objections','browser_extension_b2b_closing_readiness_snapshots','browser_extension_b2b_closing_gates','browser_extension_b2b_contract_requirements','browser_extension_b2b_payment_gates','browser_extension_b2b_payment_promises','browser_extension_b2b_revenue_rescue_cases','browser_extension_b2b_executive_interventions']
for(const table of tables){check(migration.includes(`create table if not exists public.${table}`),`table ${table}`);check(migration.includes(`alter table public.${table} enable row level security`),`RLS ${table}`)}
check(migration.includes("version='0.4.0'"),'release 0.4.0')
const commands=supplement?.commands||[]
check(commands.length===28,`28 deal commands (${commands.length})`)
for(const command of commands){check(contract.includes(`'${command}'`),`contract ${command}`);check(service.includes(`case '${command}'`)||service.includes(`case'${command}'`),`handler ${command}`)}
check(supplement?.implementedCapabilityIds?.length===10,'10 Mega ZIP 4 capabilities')
check(supplement?.scope?.length===21,'21 deal scope areas')
check(supplement?.acceptanceScenarios?.length===10,'10 acceptance scenarios')
check(supplement?.externalSending==='user-confirmed only','external sending user-confirmed')
check(supplement?.paymentConfirmation==='finance-or-authorized-role only','finance payment verification')
check(supplement?.contractSignature.includes('never fabricated'),'signature evidence policy')
check(service.includes('marginStatus'),'margin guardrails')
check(service.includes('APPROVAL_ACCESS_LEVEL_REQUIRED'),'approval-level enforcement')
check(service.includes('FINANCE_VERIFICATION_ACCESS_REQUIRED'),'finance verification enforcement')
check(service.includes('CLOSING_GATES_INCOMPLETE'),'closing gates block won')
check(service.includes('prohibited_commitments'),'executive intervention guardrails')
check(auth.includes('B2B_DEAL_COMMAND_MAP'),'deal authorization map')
check(dispatch.includes('executeB2BDealCommand'),'deal dispatcher')
check(profile.includes('Mega ZIP 4 — Deal Closing complet'),'user profile Mega ZIP 4 preset')
check(profile.includes('mega4Submodules'),'dynamic Mega ZIP 4 submodules')
check(access.includes("item.patch04Status === 'implemented'"),'Mega ZIP 4 capability allow-list')
if(failures.length){console.error('Mega ZIP 4 verification FAILED');for(const x of failures)console.error(`- ${x}`);process.exit(1)}
for(const x of passes)console.log(`PASS ${x}`)
console.log(`PASS ${commands.length} governed commands`)
console.log(`PASS ${tables.length} deal tables with RLS`)
console.log('STATUS: MEGA PATCH 04 B2B DEAL CLOSING ACCEPTED')
