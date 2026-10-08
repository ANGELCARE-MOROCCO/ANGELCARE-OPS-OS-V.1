import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'

const app = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd()
const exists = (relative) => fs.existsSync(path.join(app, relative))
const read = (relative) => fs.readFileSync(path.join(app, relative), 'utf8')
const pass = []
const fail = []
function check(label, value) { (value ? pass : fail).push(label); console.log(`${value ? '  ✓' : '  ✗'} ${label}`) }

console.log('ANGELCARE Global Marketplace — Homepage Flagship contractual verifier')

const required = [
  'angelcare-marketplace/homepage-flagship/types.ts',
  'angelcare-marketplace/homepage-flagship/copy.ts',
  'angelcare-marketplace/homepage-flagship/repository.ts',
  'angelcare-marketplace/homepage-flagship/api-handlers.ts',
  'angelcare-marketplace/homepage-flagship/admin-page.tsx',
  'angelcare-marketplace/homepage-flagship/homepage.module.css',
  'angelcare-marketplace/homepage-flagship/homepage-admin.module.css',
  'angelcare-marketplace/homepage-flagship/components/HomepageFlagship.tsx',
  'angelcare-marketplace/homepage-flagship/components/HomepageAdminCommand.tsx',
  'app/angelcare-marketplace/[locale]/[[...slug]]/page.tsx',
  'app/angelcare-marketplace/(protected)/admin/experience/homepage/page.tsx',
  'app/api/angelcare-marketplace/homepage/[kind]/route.ts',
  'app/api/angelcare-marketplace/homepage/engagement/route.ts',
  'supabase/migrations/20260801210000_angelcare_marketplace_homepage_flagship_storefront.sql',
  'angelcare-marketplace/database/rollback/20260801210000_HOMEPAGE_FLAGSHIP_SAFE_ROLLBACK.sql',
  'tsconfig.angelcare-marketplace-homepage-flagship.json',
]
for (const file of required) check(`required ${file}`, exists(file))
for (const mode of ['hero','campaigns','sections','collections','placements','audiences','territories','media','preview','analytics']) check(`admin route ${mode}`, exists(`app/angelcare-marketplace/(protected)/admin/experience/homepage/${mode}/page.tsx`))

const domainFiles = exists('angelcare-marketplace/homepage-flagship') ? fs.readdirSync(path.join(app, 'angelcare-marketplace/homepage-flagship'), { recursive: true }).filter((entry) => /\.(ts|tsx|css)$/.test(String(entry))).map((entry) => path.join('angelcare-marketplace/homepage-flagship', String(entry))) : []
const source = domainFiles.map((file) => read(file)).join('\n')
const route = read('app/angelcare-marketplace/[locale]/[[...slug]]/page.tsx')
const shell = read('angelcare-marketplace/public-universe/components/GlobalPublicShell.tsx')
const nav = read('angelcare-marketplace/shells/AdminNavigation.tsx')
const sql = read('supabase/migrations/20260801210000_angelcare_marketplace_homepage_flagship_storefront.sql')
const rollback = read('angelcare-marketplace/database/rollback/20260801210000_HOMEPAGE_FLAGSHIP_SAFE_ROLLBACK.sql')

for (const [label, pattern] of [
  ['forbidden lorem ipsum', /lorem ipsum/i], ['forbidden TODO marker', /TODO\s*:/i], ['forbidden localStorage', /localStorage/i],
  ['forbidden unsafe any assertion', /\bas\s+any\b/], ['forbidden client service-role secret', /service_role[^\n]*process\.env/i],
  ['forbidden hard-coded Dh price in JSX', /\b\d{2,}\s*Dh\b/],
]) check(label, !pattern.test(source))

check('homepage intercepts canonical accueil', /slug === 'accueil'/.test(route) && /getHomepageExperience/.test(route))
check('CMS fallback preserved', /getPublicPage/.test(route) && /PublicPageRenderer/.test(route))
check('homepage marketplace shell variant', /variant="marketplace"/.test(route))
check('FR EN AR copy exists', /fr:\s*\{/.test(read('angelcare-marketplace/homepage-flagship/copy.ts')) && /en:\s*\{/.test(read('angelcare-marketplace/homepage-flagship/copy.ts')) && /ar:\s*\{/.test(read('angelcare-marketplace/homepage-flagship/copy.ts')))
check('structural RTL', /dir=\{rtl \? 'rtl' : 'ltr'\}/.test(source) && /dir=\{locale==='ar'\?'rtl':'ltr'\}/.test(shell))
check('Hero Commerce Theatre', /heroTheatre/.test(source) && /searchDock/.test(source) && /heroControls/.test(source))
check('category exchange', /categoryExchange/.test(source) && /categoryMosaic/.test(source))
check('dedicated card families', /data-variant=\{variant\}/.test(source) && /'service' \| 'product' \| 'academy' \| 'programme' \| 'saas'/.test(source))
check('family showcase', /familyShowcase/.test(source))
check('Academy live', /academyLive/.test(source) && /academyCohorts/.test(source))
check('B2B exchange', /b2bExchange/.test(source))
check('Partner OS plans', /partnerShowcase/.test(source) && /partnerPlans/.test(source))
check('Trust evidence authority', /trustSignals/.test(source) && /verification_reference/.test(source))
check('Territory Atlas', /territoryAtlas/.test(source) && /territory_city_zones/.test(source))
check('saved comparison persistence', /homepage_visitor_selections/.test(source) && /selection_type/.test(source) && /httpOnly: true/.test(source))
check('analytics event persistence', /homepage_interactions/.test(source) && /homepage\.viewed/.test(source) && /search\.submitted/.test(source))
check('Backoffice CRUD handler', /request\.method === 'POST'/.test(source) && /request\.method === 'PATCH'/.test(source) && /request\.method === 'DELETE'/.test(source))
check('Backoffice server permission', /requireMarketplaceApiContext\('marketplace\.cms\.pages\.manage'\)/.test(source) && /requireMarketplacePageContext\('marketplace\.cms\.pages\.manage'\)/.test(source))
check('Backoffice audit writes', /writeMarketplaceAudit/.test(source) && /homepage\.\$\{kind\}/.test(source))
// V4 canonical contract: Boutique owns the storefront command center; the
// technical Experience routes remain specialist destinations beneath it.
check('Boutique navigation mounted', /label:'Boutique'/.test(nav) && /admin\/boutique'/.test(nav))
check('no obsolete French route links in marketplace shell', !/\/etablissements|\/entreprises|\/confiance/.test(shell))

const sqlTables = ['catalog_categories','catalog_item_categories','catalog_item_media','homepage_versions','homepage_campaigns','homepage_campaign_assets','homepage_sections','homepage_collections','homepage_collection_items','homepage_placements','homepage_audience_rules','homepage_territory_rules','homepage_interactions','homepage_visitor_selections']
for (const table of sqlTables) check(`SQL table ${table}`, new RegExp(`create table if not exists public\\.angelcare_marketplace_${table}`).test(sql))
check('SQL is additive', !/drop\s+table|drop\s+column|truncate\s+/i.test(sql))
check('SQL RLS enabled', (sql.match(/enable row level security/gi) || []).length >= 14)
check('SQL direct client access revoked', /revoke all on table[\s\S]*from anon,authenticated/i.test(sql))
check('SQL service access explicit', /grant all on table[\s\S]*to service_role/i.test(sql))
check('SQL seeds localized categories', /'family-services','fr'/.test(sql) && /'family-services','en'/.test(sql) && /'family-services','ar'/.test(sql))
check('SQL seeds database-managed catalogue', /homepage_flagship_initial_catalog/.test(sql) && /on conflict\(item_key\)/.test(sql))
check('SQL seeds governed campaigns', /flagship-family/.test(sql) && /flagship-academy/.test(sql) && /flagship-partner-os/.test(sql))
check('SQL does not seed fake trust badges', !/insert into public\.angelcare_marketplace_trust_badge_issuances/i.test(sql))
check('rollback preserves tables', !/drop\s+table|truncate\s+/i.test(rollback) && /status='paused'/.test(rollback))

const assetDir = path.join(app, 'public/angelcare-marketplace/homepage')
const assets = exists('public/angelcare-marketplace/homepage') ? fs.readdirSync(assetDir).filter((name) => name.endsWith('.svg')) : []
check('responsive visual asset estate', assets.length >= 25)
for (const asset of ['hero-family-marketplace.svg','hero-academy-marketplace.svg','hero-partner-os.svg','family-showcase.svg']) check(`visual asset ${asset}`, assets.includes(asset))

for (const api of ['app/api/angelcare-marketplace/homepage/[kind]/route.ts','app/api/angelcare-marketplace/homepage/engagement/route.ts']) {
  const lines = read(api).split(/\r?\n/).filter((line) => line.trim()).length
  check(`thin API adapter ${api}`, lines <= 3)
}

const docs = ['HOMEPAGE_MASTER_CONTRACT.md','HOMEPAGE_BACKEND_BINDING_MATRIX.md','HOMEPAGE_VISUAL_CONSTITUTION.md','HOMEPAGE_SECTION_REGISTER.md','HOMEPAGE_CAMPAIGN_REGISTER.md','HOMEPAGE_CATEGORY_REGISTER.md','HOMEPAGE_CARD_FAMILY_REGISTER.md','HOMEPAGE_SEARCH_CONTRACT.md','HOMEPAGE_MERCHANDISING_CONTRACT.md','HOMEPAGE_CTA_CONVERSION_MATRIX.md','HOMEPAGE_ROUTE_INTEGRITY_REPORT.md','HOMEPAGE_LOCALIZATION_RTL_REPORT.md','HOMEPAGE_RESPONSIVE_QA.md','HOMEPAGE_ACCESSIBILITY_QA.md','HOMEPAGE_PERFORMANCE_REPORT.md','HOMEPAGE_ANALYTICS_REGISTER.md','HOMEPAGE_RUNTIME_EVIDENCE.md','HOMEPAGE_OPERATOR_GUIDE.md','HOMEPAGE_HANDOVER.md','HOMEPAGE_STATE_MATRIX.md','HOMEPAGE_SECURITY_REGISTER.md','HOMEPAGE_MIGRATION_REGISTER.md']
for (const doc of docs) check(`handover ${doc}`, exists(`angelcare-marketplace/documentation/homepage-flagship/${doc}`))

// CSS Modules pure-selector gate.
for (const cssFile of ['angelcare-marketplace/homepage-flagship/homepage.module.css','angelcare-marketplace/homepage-flagship/homepage-admin.module.css']) {
  const css = read(cssFile).replace(/\/\*[\s\S]*?\*\//g, '')
  const impure = /(?:^|})\s*(?:\*|html|body|:root)\s*(?:,|\{)/m.test(css)
  check(`CSS Modules pure selectors ${cssFile}`, !impure)
}

// Syntax parse using project-local TypeScript when available.
try {
  const requireFromApp = createRequire(path.join(app, 'package.json'))
  const ts = requireFromApp('typescript')
  const tsFiles = [
    ...domainFiles.filter((file) => /\.(ts|tsx)$/.test(file)),
    'app/angelcare-marketplace/[locale]/[[...slug]]/page.tsx',
    'angelcare-marketplace/public-universe/components/GlobalPublicShell.tsx',
    'angelcare-marketplace/shells/AdminNavigation.tsx',
    ...['overview','hero','campaigns','sections','collections','placements','audiences','territories','media','preview','analytics'].map((mode) => mode === 'overview' ? 'app/angelcare-marketplace/(protected)/admin/experience/homepage/page.tsx' : `app/angelcare-marketplace/(protected)/admin/experience/homepage/${mode}/page.tsx`),
    'app/api/angelcare-marketplace/homepage/[kind]/route.ts','app/api/angelcare-marketplace/homepage/engagement/route.ts',
  ]
  let syntaxErrors = 0
  for (const file of tsFiles) {
    const scriptKind = file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
    const parsed = ts.createSourceFile(file, read(file), ts.ScriptTarget.Latest, true, scriptKind)
    syntaxErrors += parsed.parseDiagnostics.length
    for (const diagnostic of parsed.parseDiagnostics) console.error(`SYNTAX ${file}: ${ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')}`)
  }
  check(`TypeScript syntax ${tsFiles.length} files`, syntaxErrors === 0)
} catch (error) {
  console.warn(`  ! TypeScript parser unavailable: ${error instanceof Error ? error.message : String(error)}`)
}

console.log(`\nPASS ${pass.length}`)
if (fail.length) {
  console.log(`FAIL ${fail.length}`)
  for (const label of fail) console.log(`  ✗ ${label}`)
  process.exit(1)
}
console.log('RESULT: HOMEPAGE FLAGSHIP STATIC CONTRACTUAL ACCEPTANCE PASSED')
console.log('NO BUILD, GIT, DEPLOYMENT OR DATABASE MIGRATION WAS EXECUTED.')
