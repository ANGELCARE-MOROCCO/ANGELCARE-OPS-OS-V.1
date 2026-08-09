import fs from 'node:fs'

const requiredFiles = [
  'supabase/migrations/20260630_ac360_phase1b_runtime_bridge.sql',
  'lib/ac360/runtime.ts',
  'app/api/ac360/bootstrap/route.ts',
  'app/api/ac360/context/route.ts',
  'app/api/ac360/billing-center/route.ts',
  'app/api/ac360/addons/route.ts',
  'app/api/ac360/credits/topup/route.ts',
  'app/api/ac360/invoices/generate/route.ts',
  'app/api/ac360/lifecycle/reconcile/route.ts',
  'app/(protected)/angelcare-360/billing-center/page.tsx',
]

const requiredSqlFunctions = [
  'ac360_bootstrap_foundation_org',
  'ac360_grant_credits',
  'ac360_record_usage',
  'ac360_activate_addon',
  'ac360_cancel_addon',
  'ac360_generate_subscription_invoice',
  'ac360_reconcile_lifecycle',
]

const requiredRuntimeExports = [
  'getAc360CurrentContext',
  'bootstrapAc360FoundationOrg',
  'getAc360BillingCenter',
  'activateAc360Addon',
  'cancelAc360Addon',
  'grantAc360Credits',
  'generateAc360Invoice',
  'reconcileAc360Lifecycle',
  'requireAc360FeatureAccess',
]

let ok = true
function assert(condition, message) {
  if (!condition) {
    ok = false
    console.error(`❌ ${message}`)
  } else {
    console.log(`✅ ${message}`)
  }
}

for (const file of requiredFiles) {
  assert(fs.existsSync(file), `Required file present: ${file}`)
}

const sql = fs.readFileSync('supabase/migrations/20260630_ac360_phase1b_runtime_bridge.sql', 'utf8')
for (const fn of requiredSqlFunctions) {
  assert(sql.includes(`function public.${fn}`), `SQL function present: ${fn}`)
}

assert(sql.includes('Insufficient AngelCare Credits'), 'Strict wallet deduction / insufficient-credit block present')
assert(sql.includes('data_preservation'), 'Add-on cancellation data-preservation metadata present')
assert(sql.includes('AC360-ENG-29'), 'Add-on activation engine audited')
assert(sql.includes('AC360-ENG-37'), 'Overage / top-up restriction engine audited')
assert(sql.includes('AC360-ENG-41'), 'Lifecycle warning/recommendation engine audited')

const runtime = fs.readFileSync('lib/ac360/runtime.ts', 'utf8')
for (const exp of requiredRuntimeExports) {
  assert(runtime.includes(` ${exp}`) || runtime.includes(`function ${exp}`) || runtime.includes(`async function ${exp}`), `Runtime export present: ${exp}`)
}

const billingPage = fs.readFileSync('app/(protected)/angelcare-360/billing-center/page.tsx', 'utf8')
assert(billingPage.includes('AngelCare 360 Billing Center'), 'Runtime billing center page title present')
assert(!/background:\s*["']?#0(00|f172a|b1020)/i.test(billingPage), 'No forbidden dark workspace background in AC360 billing page')

const routeFiles = requiredFiles.filter((file) => file.startsWith('app/api/'))
for (const file of routeFiles) {
  const content = fs.readFileSync(file, 'utf8')
  assert(content.includes('force-dynamic'), `No-cache dynamic API route: ${file}`)
}

if (!ok) {
  console.error('\nAC360 Phase 1B runtime bridge verification failed.')
  process.exit(1)
}

console.log('\nAC360 Phase 1B runtime bridge verification passed.')
