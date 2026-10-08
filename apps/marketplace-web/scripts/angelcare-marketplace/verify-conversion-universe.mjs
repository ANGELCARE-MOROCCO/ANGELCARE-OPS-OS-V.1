import fs from 'node:fs'
import path from 'node:path'

const app=process.cwd()
const read=relative=>fs.readFileSync(path.join(app,relative),'utf8')
const exists=relative=>fs.existsSync(path.join(app,relative))
const pass=[];const fail=[]
const check=(label,condition)=>{(condition?pass:fail).push(label);console.log(`  ${condition?'✓':'✗'} ${label}`)}
const required=[
 'angelcare-marketplace/conversion-universe/types.ts',
 'angelcare-marketplace/conversion-universe/content.ts',
 'angelcare-marketplace/conversion-universe/validation.ts',
 'angelcare-marketplace/conversion-universe/repository.ts',
 'angelcare-marketplace/conversion-universe/api-handlers.ts',
 'angelcare-marketplace/conversion-universe/conversion.module.css',
 'angelcare-marketplace/conversion-universe/components/ConversionFrame.tsx',
 'angelcare-marketplace/conversion-universe/components/ServiceBookingExperience.tsx',
 'angelcare-marketplace/conversion-universe/components/BasketExperience.tsx',
 'angelcare-marketplace/conversion-universe/components/CheckoutExperience.tsx',
 'angelcare-marketplace/conversion-universe/components/AcademyEnrollmentExperience.tsx',
 'angelcare-marketplace/conversion-universe/components/B2BQuotationExperience.tsx',
 'angelcare-marketplace/conversion-universe/components/PartnerSubscriptionExperience.tsx',
 'angelcare-marketplace/conversion-universe/components/QualityAssessmentExperience.tsx',
 'angelcare-marketplace/conversion-universe/components/ConversionAdminCommand.tsx',
 'angelcare-marketplace/conversion-universe/components/ConversionQueueBoard.tsx',
 'app/angelcare-marketplace/[locale]/basket/page.tsx',
 'app/angelcare-marketplace/[locale]/quote-basket/page.tsx',
 'app/angelcare-marketplace/[locale]/checkout/page.tsx',
 'app/angelcare-marketplace/[locale]/booking/[itemSlug]/page.tsx',
 'app/angelcare-marketplace/[locale]/enrollment/[itemSlug]/page.tsx',
 'app/angelcare-marketplace/[locale]/quotation/[itemSlug]/page.tsx',
 'app/angelcare-marketplace/[locale]/subscription/[itemSlug]/page.tsx',
 'app/angelcare-marketplace/(protected)/admin/conversion/page.tsx',
 'app/angelcare-marketplace/(protected)/admin/conversion/sessions/page.tsx',
 'app/angelcare-marketplace/(protected)/admin/conversion/baskets/page.tsx',
 'app/angelcare-marketplace/(protected)/admin/conversion/quotations/page.tsx',
 'app/angelcare-marketplace/(protected)/admin/conversion/bookings/page.tsx',
 'app/angelcare-marketplace/(protected)/admin/conversion/enrollments/page.tsx',
 'app/angelcare-marketplace/(protected)/admin/conversion/holds/page.tsx',
 'app/angelcare-marketplace/(protected)/admin/conversion/consents/page.tsx',
 'app/angelcare-marketplace/(protected)/admin/conversion/exceptions/page.tsx',
 'app/api/angelcare-marketplace/conversion/sessions/route.ts',
 'app/api/angelcare-marketplace/conversion/sessions/[sessionKey]/price/route.ts',
 'app/api/angelcare-marketplace/conversion/sessions/[sessionKey]/availability/route.ts',
 'app/api/angelcare-marketplace/conversion/sessions/[sessionKey]/consent/route.ts',
 'app/api/angelcare-marketplace/conversion/sessions/[sessionKey]/confirm/route.ts',
 'app/api/angelcare-marketplace/conversion/basket/route.ts',
 'app/api/angelcare-marketplace/conversion/basket/[basketId]/items/route.ts',
 'app/api/angelcare-marketplace/conversion/basket/[basketId]/checkout/route.ts',
 'app/api/angelcare-marketplace/conversion/admin/summary/route.ts',
 'app/api/angelcare-marketplace/conversion/admin/sessions/route.ts',
 'app/api/angelcare-marketplace/conversion/admin/sessions/[sessionId]/recover/route.ts',
 'supabase/migrations/20260802090000_angelcare_marketplace_conversion_universe.sql',
 'angelcare-marketplace/database/rollback/20260802090000_angelcare_marketplace_conversion_universe_SAFE_ROLLBACK.sql',
 'tsconfig.angelcare-marketplace-conversion-universe.json'
]
console.log('ANGELCARE Global Marketplace — Conversion Universe contractual verifier')
for(const file of required)check(`required ${file}`,exists(file))
if(fail.length){console.log(`\nPASS ${pass.length}\nFAIL ${fail.length}`);process.exit(1)}
const sourceFiles=[]
for(const base of ['angelcare-marketplace/conversion-universe','app/angelcare-marketplace/[locale]/basket','app/angelcare-marketplace/[locale]/quote-basket','app/angelcare-marketplace/[locale]/checkout','app/angelcare-marketplace/[locale]/booking','app/angelcare-marketplace/[locale]/enrollment','app/angelcare-marketplace/[locale]/quotation','app/angelcare-marketplace/[locale]/subscription','app/angelcare-marketplace/(protected)/admin/conversion','app/api/angelcare-marketplace/conversion']){
 const root=path.join(app,base);if(!fs.existsSync(root))continue
 const walk=dir=>{for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const full=path.join(dir,entry.name);if(entry.isDirectory())walk(full);else if(/\.(ts|tsx)$/.test(entry.name))sourceFiles.push(full)}};walk(root)
}
const source=sourceFiles.map(file=>fs.readFileSync(file,'utf8')).join('\n')
for(const [label,pattern] of [
 ['forbidden lorem ipsum',/lorem ipsum/i],['forbidden hidden TODO',/TODO\s*:/i],['forbidden localStorage persistence',/localStorage/i],['forbidden TypeScript ignore',/@ts-(?:ignore|nocheck|expect-error)/i],['forbidden unsafe any assertion',/\bas\s+any\b/i],['forbidden mock-only markers',/mock-only|fake availability|fake price/i],['forbidden client service-role secret',/service[_-]?role.*process\.env/i]
])check(label,!pattern.test(source))
const types=read('angelcare-marketplace/conversion-universe/types.ts')
for(const journey of ['service_booking','product_checkout','academy_enrollment','b2b_quotation','partner_subscription','quality_assessment'])check(`journey ${journey}`,types.includes(`'${journey}'`))
const repository=read('angelcare-marketplace/conversion-universe/repository.ts')
for(const marker of ['angelcare_marketplace_finance_price_rules','angelcare_marketplace_catalog_availability','angelcare_marketplace_academy_cohorts','angelcare_marketplace_family_quote_requests','angelcare_marketplace_crm_leads','angelcare_marketplace_partner_subscriptions','angelcare_marketplace_territories','idempotency_key','visitor_reference_hash','price_snapshot_id'])check(`backend binding ${marker}`,repository.includes(marker))
check('basket price revalidates every line',repository.includes('evidenceLines')&&repository.includes('lineCount: lines.length'))
check('basket availability revalidates every line',repository.includes('holdTargets')&&repository.includes('Au moins une ligne n’est plus disponible'))
check('confirmation requires price snapshot',repository.includes('Le prix ou le statut devis doit être revérifié'))
check('confirmation requires versioned consents',repository.includes("mandatory = ['marketplace_terms', 'privacy_notice']"))
check('health-adjacent non-medical consent gate',repository.includes("mandatory.push('non_medical_boundary')"))
check('service territories resolve from Territory OS',repository.includes("input.journey === 'service_booking'")&&repository.includes('territoryCode: row.territory_code'))
const serviceBooking=read('angelcare-marketplace/conversion-universe/components/ServiceBookingExperience.tsx')
check('service booking receives governed territory options',serviceBooking.includes('territories: ConversionOption[]')&&serviceBooking.includes('territoryCode'))
const api=read('angelcare-marketplace/conversion-universe/api-handlers.ts')
check('admin APIs use server permission guard',api.includes("requireMarketplaceApiContext('marketplace.conversion.view')")&&api.includes("requireMarketplaceApiContext('marketplace.conversion.recover')"))
const adapters=sourceFiles.filter(file=>file.includes('/app/api/'))
for(const file of adapters){const lines=fs.readFileSync(file,'utf8').split(/\r?\n/).filter(line=>line.trim()).length;check(`thin API ${path.relative(app,file)}`,lines<=3)}
const itemDetail=read('angelcare-marketplace/catalog-discovery/components/ItemDetail.tsx')
check('conversion UI contains no hard-coded Moroccan city catalogue',!/(Rabat|Casablanca|Kénitra|Tanger|Marrakech)/.test(serviceBooking+itemDetail))
check('catalog CTA resolves journey-specific conversion',itemDetail.includes('journeyPath(locale,item)')&&itemDetail.includes('journeyLabel(journeyForItem(item),locale)'))
const nav=read('angelcare-marketplace/shells/AdminNavigation.tsx')
// Conversion is a specialist tool owned by the canonical Orders workspace.
const ordersCommand=read('angelcare-marketplace/customer-commerce/components/EnterpriseOrderCommand.tsx')
check('Conversion specialist owned by Orders workspace',nav.includes("/angelcare-marketplace/admin/orders")&&ordersCommand.includes('/angelcare-marketplace/admin/conversion')&&exists('app/angelcare-marketplace/(protected)/admin/conversion/page.tsx'))
const permissionTypes=read('angelcare-marketplace/domain/types.ts')
const permissionCatalog=read('angelcare-marketplace/permissions/permission-catalog.ts')
for(const permission of ['marketplace.conversion.view','marketplace.conversion.manage','marketplace.conversion.recover','marketplace.conversion.configuration.manage','marketplace.conversion.analytics.view','marketplace.conversion.export'])check(`permission ${permission}`,permissionTypes.includes(permission)&&permissionCatalog.includes(permission))
const css=read('angelcare-marketplace/conversion-universe/conversion.module.css')
for(const marker of ['.journeyHero','.basketLayout','.checkoutSteps','.adminHero','.queueGrid','@media(max-width:720px)','prefers-reduced-motion','[dir="rtl"]'])check(`visual ${marker}`,css.replace(/\s+/g,'').includes(marker.replace(/\s+/g,'')))
check('CSS Module has no global universal selector',!/^\s*\*\s*\{/m.test(css))
check('CSS Module has no global html/body/root selector',!/^\s*(?:html|body|:root)\b/m.test(css))
const migration=read('supabase/migrations/20260802090000_angelcare_marketplace_conversion_universe.sql')
for(const table of ['conversion_sessions','conversion_price_snapshots','conversion_availability_holds','conversion_consents','conversion_outcomes','conversion_events','conversion_exceptions','conversion_policies'])check(`SQL table ${table}`,migration.includes(`angelcare_marketplace_${table}`))
for(const marker of ['enable row level security','revoke all on table','grant all on table','marketplace.conversion.enabled','on conflict(policy_key) do update','on conflict(permission_key) do update'])check(`SQL ${marker}`,migration.toLowerCase().includes(marker.toLowerCase()))
check('SQL is additive: no drop table',!/drop\s+table/i.test(migration))
check('SQL is additive: no drop column',!/drop\s+column/i.test(migration))
check('SQL is additive: no truncate',!/truncate/i.test(migration))
const rollback=read('angelcare-marketplace/database/rollback/20260802090000_angelcare_marketplace_conversion_universe_SAFE_ROLLBACK.sql')
check('rollback preserves conversion records',!/drop\s+table|truncate|delete\s+from/i.test(rollback))
check('rollback releases active holds',rollback.includes("status='released'"))
const publicRoutes=['basket','quote-basket','checkout','booking/[itemSlug]','enrollment/[itemSlug]','quotation/[itemSlug]','subscription/[itemSlug]']
for(const route of publicRoutes)check(`public route ${route}`,exists(`app/angelcare-marketplace/[locale]/${route}/page.tsx`))
for(const stage of ['identity','configuration','availability','consent','review','confirmation'])check(`checkout stage ${stage}`,exists(`app/angelcare-marketplace/[locale]/checkout/${stage}/page.tsx`))
const docsRoot='angelcare-marketplace/documentation/conversion-universe'
for(const doc of ['CONTRACT.md','IMPLEMENTATION_REPORT.md','ROUTE_INVENTORY.md','ENTITY_REGISTER.md','API_REGISTER.md','PERMISSION_MATRIX.md','LIFECYCLE_MATRIX.md','BACKEND_BINDING_MATRIX.md','JOURNEY_TEMPLATE_REGISTER.md','PRICE_AVAILABILITY_CONSENT_MATRIX.md','SECURITY_ISOLATION.md','FR_EN_AR_RTL_REPORT.md','RESPONSIVE_QA.md','ACCESSIBILITY_QA.md','RUNTIME_EVIDENCE.md','MIGRATION_REGISTER.md','SAFE_ROLLBACK.md','OPERATOR_GUIDE.md','KNOWN_DEPENDENCIES.md','HANDOVER.md','ACCEPTANCE_MATRIX.md','VISUAL_EVIDENCE_REGISTER.md'])check(`handover ${doc}`,exists(`${docsRoot}/${doc}`))
console.log(`\nPASS ${pass.length}`)
if(fail.length){console.log(`FAIL ${fail.length}`);for(const label of fail)console.log(`  ✗ ${label}`);process.exit(1)}
console.log('RESULT: CONVERSION UNIVERSE STATIC CONTRACTUAL ACCEPTANCE PASSED')
console.log('NO BUILD, GIT, DEPLOYMENT OR DATABASE MIGRATION WAS EXECUTED.')
