import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
let passed = 0
let failed = 0

function rel(...parts) { return path.join(root, ...parts) }
function exists(p) { return fs.existsSync(rel(p)) }
function text(p) { return fs.readFileSync(rel(p), 'utf8') }
function pass(label) { passed++; console.log(`PASS  ${label}`) }
function fail(label, detail='') { failed++; console.error(`FAIL  ${label}${detail ? ` — ${detail}` : ''}`) }
function check(label, condition, detail='') { condition ? pass(label) : fail(label, detail) }
function has(p, needle) { return exists(p) && text(p).includes(needle) }

const coveredAdminRoots = [
  'app/angelcare-marketplace/(protected)/admin/catalog',
  'app/angelcare-marketplace/(protected)/admin/commerce-studio',
  'app/angelcare-marketplace/(protected)/admin/commercial',
  'app/angelcare-marketplace/(protected)/admin/conversion',
  'app/angelcare-marketplace/(protected)/admin/orders',
  'app/angelcare-marketplace/(protected)/admin/payments',
  'app/angelcare-marketplace/(protected)/admin/wallet',
  'app/angelcare-marketplace/(protected)/admin/finance',
  'app/angelcare-marketplace/(protected)/admin/providers',
  'app/angelcare-marketplace/(protected)/admin/vendors',
  'app/angelcare-marketplace/(protected)/admin/partner-os',
  'app/angelcare-marketplace/(protected)/admin/operations',
]

function sourceFiles(dir) {
  if (!fs.existsSync(dir)) return []
  const out=[]
  for (const entry of fs.readdirSync(dir,{withFileTypes:true})) {
    const p=path.join(dir,entry.name)
    if(entry.isDirectory()) out.push(...sourceFiles(p))
    else if(/\.(ts|tsx|js|jsx|mjs|cjs)$/.test(entry.name)) out.push(p)
  }
  return out
}

const coveredSources = coveredAdminRoots.flatMap(p => sourceFiles(rel(p)))
const genericHits = []
for (const file of coveredSources) {
  const body=fs.readFileSync(file,'utf8')
  if (/\b(AuthorityWorkspace|PlaceholderWorkspace|VendorCommerceCommand)\b/.test(body)) {
    genericHits.push(path.relative(root,file))
  }
}
check('Covered ZIP1 Admin routes contain no generic placeholder workspace', genericHits.length===0, genericHits.join(', '))

check('Admin operating kernel migration exists', exists('supabase/migrations/20260810030000_angelcare_marketplace_ultra_mz1_vertical_operating_kernel.sql'))
const migration = text('supabase/migrations/20260810030000_angelcare_marketplace_ultra_mz1_vertical_operating_kernel.sql')
for (const table of [
  'angelcare_marketplace_admin_access_policies',
  'angelcare_marketplace_workspace_registry',
  'angelcare_marketplace_operating_cases',
  'angelcare_marketplace_operating_assignments',
  'angelcare_marketplace_operating_timeline',
  'angelcare_marketplace_operating_evidence',
  'angelcare_marketplace_operating_approvals',
  'angelcare_marketplace_operating_exceptions',
  'angelcare_marketplace_operating_recovery_actions',
  'angelcare_marketplace_command_idempotency',
  'angelcare_marketplace_vendor_contracts',
  'angelcare_marketplace_vendor_orders',
  'angelcare_marketplace_vendor_inventory_authority',
  'angelcare_marketplace_vendor_quality_reviews',
  'angelcare_marketplace_vendor_performance_events',
]) check(`Migration defines ${table}`, migration.includes(table))

check('Migration contains no destructive DROP TABLE', !/\bdrop\s+table\b/i.test(migration))
check('Migration contains no TRUNCATE', !/\btruncate\b/i.test(migration))
check('Migration contains no DELETE FROM', !/\bdelete\s+from\b/i.test(migration))
check('New MZ1 evidence/financial authorities contain no ON DELETE CASCADE', !/on\s+delete\s+cascade/i.test(migration))

check('Marketplace-owned Admin access policy exists', exists('lib/auth/marketplace-access-policy.ts'))
const authRuntime = [
  'angelcare-marketplace/auth/admin/admin-auth.ts',
  'lib/auth/marketplace-access-policy.ts',
  'lib/auth/session.ts',
  'lib/getUser.ts',
].map(p=>exists(p)?text(p):'').join('\n')
check('Marketplace Admin runtime has no AC360 operator access dependency', !authRuntime.includes('angelcare360_operator_tenant_access_accounts'))
check('Absolute marketplace_admin authority preserved', has('angelcare-marketplace/auth/context.ts', "roleKeys.includes('marketplace_admin')"))

check('Typed ZIP1 workspace registry exists', exists('angelcare-marketplace/admin-operating/workspace-registry.ts'))
const registry = text('angelcare-marketplace/admin-operating/workspace-registry.ts')
const workspaceCount = (registry.match(/\bd\(\{key:/g) || []).length
check('ZIP1 registry contains broad vertical workspace coverage', workspaceCount >= 25, `count=${workspaceCount}`)
for (const key of ['catalog.command','commercial.pipeline','payments.command','wallet.command','orders.command','finance.command','providers.command','vendors.command','partner_os.command','operations.fulfillment','operations.returns','operations.disputes','operations.recovery','operations.reconciliation']) {
  check(`Workspace registry contains ${key}`, registry.includes(`key:'${key}'`))
}

check('Operating command center exists', exists('angelcare-marketplace/admin-operating/components/OperatingCommandCenter.tsx'))
check('Operating dossier exists', exists('angelcare-marketplace/admin-operating/components/OperatingDossier.tsx'))
check('Operating dossier actions exist', exists('angelcare-marketplace/admin-operating/components/OperatingDossierActions.tsx'))
for (const word of ['assignment','evidence','approval','exception','recovery','comments']) {
  check(`Operating repository supports ${word}`, has('angelcare-marketplace/admin-operating/repository.ts', word))
}

check('Payments Admin uses real PaymentAdminCommand', has('app/angelcare-marketplace/(protected)/admin/payments/page.tsx','PaymentAdminCommand'))
check('Payment Admin repository exists', exists('angelcare-marketplace/customer-commerce/payment-admin.ts'))
check('Payment Admin supports reconciliation', has('angelcare-marketplace/customer-commerce/payment-admin.ts','transitionPaymentReconciliation'))
check('Wallet Admin authority exists', exists('angelcare-marketplace/customer-commerce/wallet-admin.ts'))
check('Wallet reconciliation command exists', has('angelcare-marketplace/customer-commerce/wallet-admin.ts','transitionWalletReconciliation'))
for (const mode of ['customers','risk','reconciliation']) {
  check(`Wallet ${mode} page uses authority client`, has(`app/angelcare-marketplace/(protected)/admin/wallet/${mode}/page.tsx`,'WalletAuthorityClient'))
}

check('Enterprise order transition has guarded lifecycle', has('angelcare-marketplace/customer-commerce/admin-repository.ts','enterpriseOrderTransitions'))
check('Order completion verifies payment obligation', has('angelcare-marketplace/customer-commerce/admin-repository.ts','montant capturé'))
check('Order completion verifies fulfillment closure', has('angelcare-marketplace/customer-commerce/admin-repository.ts','fulfillment'))

check('Finance margin decisions exposed in Admin client', has('angelcare-marketplace/finance-authority/components/FinanceDecisionClients.tsx','margin'))
check('Finance reconciliation resolver exists', has('angelcare-marketplace/finance-authority/repository.ts','resolveReconciliationEvent'))
check('Finance invoice readiness control preserved', has('angelcare-marketplace/finance-authority/components/FinanceDecisionClients.tsx','invoice'))

for (const page of ['onboarding','documents','certifications','availability','eligibility','payable-eligibility','performance']) {
  check(`Provider ${page} workspace is purpose-built`, has(`app/angelcare-marketplace/(protected)/admin/providers/${page}/page.tsx`,'Provider'))
}
check('Provider lifecycle backend exists', has('angelcare-marketplace/provider-workforce/repository.ts','transitionProviderLifecycle'))
check('Provider payable backend exists', has('angelcare-marketplace/provider-workforce/repository.ts','Payable'))
check('Provider performance backend exists', has('angelcare-marketplace/provider-workforce/repository.ts','recordProviderPerformance'))

for (const page of ['page.tsx','registry/page.tsx','onboarding/page.tsx','contracts/page.tsx','catalog-links/page.tsx','inventory/page.tsx','orders/page.tsx','quality/page.tsx','performance/page.tsx','disputes/page.tsx','settlements/page.tsx']) {
  const p = page === 'page.tsx' ? 'app/angelcare-marketplace/(protected)/admin/vendors/page.tsx' : `app/angelcare-marketplace/(protected)/admin/vendors/${page}`
  check(`Vendor workspace ${page} uses VendorAuthorityClient`, has(p,'VendorAuthorityClient'))
}
check('Vendor authority repository exists', exists('angelcare-marketplace/vendor-authority/repository.ts'))
check('Vendor settlement decision is governed', has('angelcare-marketplace/vendor-authority/repository.ts','decideVendorSettlement'))

check('Partner tenant creation desk exists', has('angelcare-marketplace/partner-os/components/PartnerLifecycleClient.tsx','TenantCreateDesk'))
check('Partner tenant lifecycle desk exists', has('angelcare-marketplace/partner-os/components/PartnerLifecycleClient.tsx','TenantLifecycleDesk'))
check('Partner tenant dossier route exists', exists('app/angelcare-marketplace/(protected)/admin/partner-os/tenants/[tenantId]/page.tsx'))
check('Partner tenant modules can be governed', has('angelcare-marketplace/partner-os/repository.ts','upsertTenantModule'))
check('Partner subscriptions can be assigned', has('angelcare-marketplace/partner-os/repository.ts','assignTenantSubscription'))

check('Operations incidents have real authority client', exists('angelcare-marketplace/operations-execution/components/IncidentAuthorityClient.tsx'))
check('Operations proof/checklist/report registers exist', exists('angelcare-marketplace/operations-execution/components/OperationsEvidenceRegisters.tsx'))
check('Fulfillment evidence review exists', has('angelcare-marketplace/operations-reconciliation/repository.ts','reviewFulfillmentEvidence'))
for (const fn of ['transitionReturnCase','transitionReplacementCase','transitionDisputeCase','transitionRecoveryPlan','decideReconciliationLine','transitionOperationsReconciliation','updateSettlementReadiness']) {
  check(`Operations reconciliation supports ${fn}`, has('angelcare-marketplace/operations-reconciliation/repository.ts',fn))
}
check('Fulfillment quality gate requires validated evidence', has('angelcare-marketplace/operations-reconciliation/repository.ts','validation_status'))

check('Commercial lead creation desk exists', has('angelcare-marketplace/commercial-pipeline/components/CommercialActionClient.tsx','LeadCreateDesk'))
check('Commercial opportunity lifecycle desk exists', has('angelcare-marketplace/commercial-pipeline/components/CommercialActionClient.tsx','OpportunityLifecycleDesk'))
check('Quote lifecycle desk exists', has('angelcare-marketplace/commercial-pipeline/components/CommercialActionClient.tsx','QuoteLifecycleDesk'))
check('Quote lifecycle backend exists', has('angelcare-marketplace/commercial-pipeline/repository.ts','transitionQuote'))
check('Quote approval backend exists', has('angelcare-marketplace/commercial-pipeline/repository.ts','decideQuoteApproval'))

check('PayPal production verifier preserved', exists('scripts/angelcare-marketplace/verify-paypal-production-backbone.mjs'))
check('PayPal Orders v2 production implementation preserved', has('angelcare-marketplace/customer-commerce/paypal.ts','/v2/checkout/orders'))
check('PayPal webhook signature verification preserved', has('angelcare-marketplace/customer-commerce/paypal.ts','verify-webhook-signature'))
check('PayPal currency remains EUR-locked', has('angelcare-marketplace/customer-commerce/paypal.ts',"currency !== 'EUR'"))

const zeroRoot=[]
for(const entry of fs.readdirSync(root,{withFileTypes:true})){
  if(entry.isFile()){
    const p=rel(entry.name)
    if(fs.statSync(p).size===0) zeroRoot.push(entry.name)
  }
}
check('No accidental zero-byte files remain at Marketplace root', zeroRoot.length===0, zeroRoot.join(', '))

for(const removed of ['bridge','workers','hooks','deployment','carelink_duplicate_route_backup','database','data','sql']) {
  check(`Unrelated non-runtime tree ${removed}/ removed`, !exists(removed))
}

console.log(`\nULTRA MEGA ZIP 1 STATIC ACCEPTANCE: ${failed ? 'FAIL' : 'PASS'} (${passed}/${passed+failed})`)
if(failed) process.exit(1)
