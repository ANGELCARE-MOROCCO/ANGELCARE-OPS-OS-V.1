import fs from 'node:fs'
import path from 'node:path'

const app = process.cwd()
let passed = 0
let failed = 0

function read(rel) {
  return fs.readFileSync(path.join(app, rel), 'utf8')
}
function exists(rel) {
  return fs.existsSync(path.join(app, rel))
}
function check(label, condition) {
  if (condition) {
    console.log(`  ✓ ${label}`)
    passed += 1
  } else {
    console.error(`  ✗ ${label}`)
    failed += 1
  }
}

console.log('ANGELCARE Ultra Delivery 1/5 — integration correction verifier')

const required = [
  'angelcare-marketplace/experience-builder/components/CreatePageClient.tsx',
  'app/angelcare-marketplace/(family)/family/dashboard/page.tsx',
  'app/angelcare-marketplace/(family)/family/layout.tsx',
  'app/angelcare-marketplace/(protected)/admin/action-center/page.tsx',
  'app/angelcare-marketplace/(protected)/admin/approvals/page.tsx',
  'app/angelcare-marketplace/(protected)/admin/experience/page.tsx',
  'app/angelcare-marketplace/(protected)/admin/experience/pages/new/page.tsx',
  'app/angelcare-marketplace/(protected)/admin/experience/pages/[pageId]/page.tsx',
  'app/angelcare-marketplace/(protected)/admin/experience/pages/[pageId]/builder/page.tsx',
  'app/angelcare-marketplace/[locale]/[[...slug]]/page.tsx',
  'app/angelcare-marketplace/preview/[token]/page.tsx',
  'app/api/angelcare-marketplace/family/requests/route.ts',
  'app/api/angelcare-marketplace/family/requests/[requestId]/route.ts',
]
required.forEach((rel) => check(`required correction file: ${rel}`, exists(rel)))

const ultraFiles = []
for (const root of [
  'angelcare-marketplace/sovereign-control',
  'angelcare-marketplace/experience-builder',
  'angelcare-marketplace/public-universe',
  'angelcare-marketplace/family-experience',
  'app/angelcare-marketplace',
  'app/api/angelcare-marketplace',
]) {
  const absolute = path.join(app, root)
  if (!fs.existsSync(absolute)) continue
  const walk = (dir) => {
    for (const name of fs.readdirSync(dir)) {
      const target = path.join(dir, name)
      const stat = fs.statSync(target)
      if (stat.isDirectory()) walk(target)
      else if (/\.(ts|tsx)$/.test(target)) ultraFiles.push(target)
    }
  }
  walk(absolute)
}
const source = ultraFiles.map((file) => fs.readFileSync(file, 'utf8')).join('\n')

check('family dashboard component prop aligned', !source.includes('bundle={await getFamilyDashboard'))
check('action center prop aligned', !source.includes('<ActionCenter actions='))
check('approval center prop aligned', !source.includes('<ApprovalCenter approvals='))
check('family shell no obsolete context prop', !source.includes('<FamilyShell context='))
check('obsolete experienceSummary import absent', !source.includes('experienceSummary'))
check('obsolete getPageBundle import absent', !source.includes('getPageBundle'))
check('obsolete getPreviewPage import absent', !source.includes('getPreviewPage'))
check('public shell navigation prop aligned', !source.includes(' menu={'))
check('public renderer experience prop aligned', !source.includes('<PublicPageRenderer bundle='))
check('family collection API handler aligned', read('app/api/angelcare-marketplace/family/requests/route.ts').includes('handleQuoteRequests'))
check('family dossier API handler aligned', read('app/api/angelcare-marketplace/family/requests/[requestId]/route.ts').includes('handleQuoteRequest'))
check('support RPC result has explicit domain cast', read('angelcare-marketplace/family-experience/repository.ts').includes('const ticket=data as unknown as SupportTicket'))
check('approval decision no form-event mismatch', !read('angelcare-marketplace/sovereign-control/components/ApprovalCenter.tsx').includes('FormEvent<HTMLFormElement>'))
check('sovereign count filters are explicit', read('angelcare-marketplace/sovereign-control/repository.ts').includes("filter: { column: string; value: string } | { column: string; values: string[] }"))
check('public repository exports route helper', read('angelcare-marketplace/public-universe/repository.ts').includes('export function publicRoutePath'))
check('public repository exports inquiry list', read('angelcare-marketplace/public-universe/repository.ts').includes('export async function listPublicInquiries'))

const permissionSource = read('angelcare-marketplace/domain/types.ts')
for (const permission of [
  'marketplace.backoffice.cockpit.view',
  'marketplace.backoffice.audit.export',
  'marketplace.backoffice.briefs.manage',
  'marketplace.cms.pages.manage',
  'marketplace.cms.export',
  'marketplace.public.content.preview',
  'marketplace.family.access',
  'marketplace.family.admin.view',
  'marketplace.family.admin.manage',
  'marketplace.family.missions.manage',
  'marketplace.family.reports.publish',
  'marketplace.family.export',
]) {
  check(`canonical permission: ${permission}`, permissionSource.includes(`'${permission}'`))
}

const sql04 = read('supabase/migrations/20260801010000_angelcare_marketplace_ultra_01_mz04_sovereign_control.sql')
const sql05 = read('supabase/migrations/20260801020000_angelcare_marketplace_ultra_01_mz05_experience_cms.sql')
const sql06 = read('supabase/migrations/20260801030000_angelcare_marketplace_ultra_01_mz06_public_universe.sql')
const sql07 = read('supabase/migrations/20260801040000_angelcare_marketplace_ultra_01_mz07_family_engine.sql')
const allSql = `${sql04}\n${sql05}\n${sql06}\n${sql07}`

check('all migrations remain non-destructive', !/drop\s+table|truncate\s+/i.test(allSql))
check('module permissions use text arrays', !/required_permissions\s*=\s*'\[[^;]+::jsonb/i.test(allSql) && /required_permissions=array\[/i.test(allSql))
check('CMS runtime schema has route_key', /route_key text not null/i.test(sql05))
check('CMS runtime schema has translation_status', /translation_status text not null/i.test(sql05))
check('CMS runtime schema has preview_token', /preview_token text unique/i.test(sql05))
check('CMS PL/pgSQL declarations are syntactically singular', !/;\s*declare\s+/i.test(sql05))
check('public inquiries persist consent timestamp', /consent_granted_at timestamptz/i.test(sql06))
check('public events persist event_data', /event_data jsonb/i.test(sql06))
check('family account persists onboarding status', /onboarding_status text not null/i.test(sql07))
check('family diagnostic persists schedule needs', /schedule_needs jsonb/i.test(sql07))
check('family support author types include staff and system', /author_type in\('family','staff','system'\)/i.test(sql07))

console.log(`\nPASS ${passed}`)
if (failed) {
  console.error(`FAIL ${failed}`)
  process.exit(1)
}
console.log('RESULT: ULTRA DELIVERY 1/5 INTEGRATION CORRECTION PASSED')
