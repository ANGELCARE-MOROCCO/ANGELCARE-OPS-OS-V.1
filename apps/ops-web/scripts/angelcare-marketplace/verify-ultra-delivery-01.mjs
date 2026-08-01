import fs from 'node:fs'
import path from 'node:path'
const app=process.cwd()
let pass=0, fail=0
function ok(condition,label){if(condition){console.log(`  ✓ ${label}`);pass++}else{console.error(`  ✗ ${label}`);fail++}}
function exists(rel){return fs.existsSync(path.join(app,rel))}
function read(rel){return fs.readFileSync(path.join(app,rel),'utf8')}
const required=[
'angelcare-marketplace/sovereign-control/repository.ts','angelcare-marketplace/sovereign-control/api-handlers.ts','angelcare-marketplace/sovereign-control/components/SovereignCockpit.tsx',
'angelcare-marketplace/experience-builder/repository.ts','angelcare-marketplace/experience-builder/api-handlers.ts','angelcare-marketplace/experience-builder/components/PageBuilderClient.tsx',
'angelcare-marketplace/public-universe/repository.ts','angelcare-marketplace/public-universe/components/GlobalPublicShell.tsx','angelcare-marketplace/public-universe/components/PublicPageRenderer.tsx',
'angelcare-marketplace/family-experience/repository.ts','angelcare-marketplace/family-experience/api-handlers.ts','angelcare-marketplace/family-experience/components/FamilyDashboard.tsx',
'app/angelcare-marketplace/(protected)/admin/command/page.tsx','app/angelcare-marketplace/(protected)/admin/experience/page.tsx','app/angelcare-marketplace/[locale]/[[...slug]]/page.tsx','app/angelcare-marketplace/(family)/family/dashboard/page.tsx',
'app/api/angelcare-marketplace/backoffice/summary/route.ts','app/api/angelcare-marketplace/cms/pages/route.ts','app/api/angelcare-marketplace/public/inquiries/route.ts','app/api/angelcare-marketplace/family/requests/route.ts',
'supabase/migrations/20260801010000_angelcare_marketplace_ultra_01_mz04_sovereign_control.sql','supabase/migrations/20260801020000_angelcare_marketplace_ultra_01_mz05_experience_cms.sql','supabase/migrations/20260801030000_angelcare_marketplace_ultra_01_mz06_public_universe.sql','supabase/migrations/20260801040000_angelcare_marketplace_ultra_01_mz07_family_engine.sql'
]
console.log('ANGELCARE Build 360 Ultra Delivery 1/5 verifier')
required.forEach(f=>ok(exists(f),`required ${f}`))
const sqlFiles=required.filter(f=>f.endsWith('.sql'))
for(const f of sqlFiles){const s=read(f);ok(!/drop\s+table|truncate\s+/i.test(s),`${f} non-destructive`);ok(/enable row level security/i.test(s),`${f} RLS enabled`);ok(/revoke all/i.test(s),`${f} direct access restricted`)}
const domains=['sovereign-control','experience-builder','public-universe','family-experience']
for(const d of domains){const dir=path.join(app,'angelcare-marketplace',d);const files=[];const walk=p=>{for(const n of fs.readdirSync(p)){const q=path.join(p,n),st=fs.statSync(q);if(st.isDirectory())walk(q);else if(/\.(ts|tsx|css)$/.test(q))files.push(q)}};walk(dir);const src=files.map(f=>fs.readFileSync(f,'utf8')).join('\n');ok(!/lorem ipsum|TODO\s*:|localStorage|as any|any\[\]/i.test(src),`${d} forbidden-source scan`);ok(src.includes('requestId')||d==='public-universe',`${d} request/audit discipline`)}
ok(read('angelcare-marketplace/domain/types.ts').includes('marketplace.cms.publish'),'MZ05 canonical permissions')
ok(read('angelcare-marketplace/domain/types.ts').includes('marketplace.family.requests.create'),'MZ07 canonical permissions')
ok(read('angelcare-marketplace/shells/AdminNavigation.tsx').includes('/angelcare-marketplace/admin/command'),'MZ04 navigation mounted')
ok(read('angelcare-marketplace/shells/AdminNavigation.tsx').includes('/angelcare-marketplace/admin/experience'),'MZ05 navigation mounted')
ok(read('angelcare-marketplace/shells/AdminNavigation.tsx').includes('/angelcare-marketplace/admin/families'),'MZ07 navigation mounted')
ok(read('app/angelcare-marketplace/page.tsx').includes("redirect('/angelcare-marketplace/fr')"),'MZ06 French canonical public entry')
console.log(`\nPASS ${pass}`); if(fail){console.error(`FAIL ${fail}`);process.exit(1)} console.log('RESULT: ULTRA DELIVERY 1/5 STATIC CONTRACTUAL ACCEPTANCE PASSED')
