import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const requiredFiles = [
  'supabase/migrations/20260630_ac360_phase2p_branding_domains_integrations_api.sql',
  'lib/ac360/school-branding.ts',
  'app/api/ac360/school-branding/dashboard/route.ts',
  'app/api/ac360/school-branding/branding/profile/upsert/route.ts',
  'app/api/ac360/school-branding/branding/assets/register/route.ts',
  'app/api/ac360/school-branding/domains/request/route.ts',
  'app/api/ac360/school-branding/domains/verify/route.ts',
  'app/api/ac360/school-branding/integrations/connectors/upsert/route.ts',
  'app/api/ac360/school-branding/api-keys/issue/route.ts',
  'app/api/ac360/school-branding/api-keys/revoke/route.ts',
  'app/api/ac360/school-branding/webhooks/upsert/route.ts',
  'app/api/ac360/school-branding/webhooks/deliveries/record/route.ts',
  'app/api/ac360/school-branding/integrations/events/record/route.ts',
  'app/api/ac360/school-branding/reconcile/route.ts',
  'app/api/ac360/school-branding/alerts/resolve/route.ts',
]
const requiredSql = [
  'ac360_school_brand_profiles',
  'ac360_school_brand_assets',
  'ac360_school_custom_domains',
  'ac360_school_domain_verification_events',
  'ac360_school_integration_connectors',
  'ac360_school_integration_credentials',
  'ac360_school_api_keys',
  'ac360_school_webhooks',
  'ac360_school_webhook_deliveries',
  'ac360_school_integration_events',
  'ac360_school_branding_integration_snapshots',
  'ac360_school_integration_alerts',
  'ac360_school_branding_integrations_dashboard',
  'ac360_school_upsert_brand_profile',
  'ac360_school_request_custom_domain',
  'ac360_school_issue_api_key',
  'branding_integrations_api',
  'school.branding.profile.upsert',
  'school.integration.alert.resolve',
]
let failed = false
for (const rel of requiredFiles) {
  if (!fs.existsSync(path.join(root, rel))) {
    console.error(`❌ Missing required file: ${rel}`)
    failed = true
  }
}
const sqlPath = path.join(root, 'supabase/migrations/20260630_ac360_phase2p_branding_domains_integrations_api.sql')
const sql = fs.existsSync(sqlPath) ? fs.readFileSync(sqlPath, 'utf8') : ''
for (const token of requiredSql) {
  if (!sql.includes(token)) {
    console.error(`❌ Phase 2P SQL missing token: ${token}`)
    failed = true
  }
}
const actionWiring = fs.readFileSync(path.join(root, 'lib/ac360/action-wiring.ts'), 'utf8')
for (const token of ['ac360.school_branding.profile.upsert','ac360.school_branding.domain.request','ac360.school_branding.api_key.issue','ac360.school_branding.alert.resolve']) {
  if (!actionWiring.includes(token)) {
    console.error(`❌ Static action wiring missing token: ${token}`)
    failed = true
  }
}
for (const rel of [
  'app/(protected)/angelcare-360/branding/page.tsx',
  'app/(protected)/school-branding/page.tsx',
  'app/school-branding/page.tsx',
  'app/angelcare-360/branding/page.tsx',
]) {
  if (fs.existsSync(path.join(root, rel))) {
    console.error(`❌ UI build must remain locked; unexpected page exists: ${rel}`)
    failed = true
  }
}
if (failed) process.exit(1)
console.log('✅ AC360 Phase 2P white label, branding, custom domains, integrations & API runtime verification passed.')
console.log('✅ UI build remains locked: no branding/integration front-end page.tsx created.')
