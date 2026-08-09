import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
const require=createRequire(import.meta.url)
const repo=path.resolve(process.argv[2]||path.join(process.cwd(),'..','..'))
const app=path.join(repo,'apps','ops-web')
const ts=require(path.join(app,'node_modules','typescript'))
let checks=0
const fail=(m)=>{console.error(`FAIL: ${m}`);process.exit(1)}
const pass=(m)=>{checks+=1;console.log(`PASS  ${m}`)}
const read=(r)=>{const f=path.join(app,r);if(!fs.existsSync(f))fail(`missing file: ${r}`);return fs.readFileSync(f,'utf8')}
const requiredFiles=[
  "app/(protected)/angelcare-360-command-center/(people)/layout.tsx",
  "app/(protected)/angelcare-360-command-center/(people)/personnes/page.tsx",
  "app/(protected)/angelcare-360-command-center/administration/page.tsx",
  "app/(protected)/angelcare-360-command-center/admissions/page.tsx",
  "app/(protected)/angelcare-360-command-center/direction/page.tsx",
  "app/api/angelcare360/customer-foundation/route.ts",
  "components/angelcare360/administration/Angelcare360AdminPageShell.tsx",
  "components/angelcare360/administration/Angelcare360AdministrationChrome.tsx",
  "components/angelcare360/admissions/Angelcare360AdmissionDossier.module.css",
  "components/angelcare360/admissions/Angelcare360AdmissionDossier.tsx",
  "components/angelcare360/admissions/Angelcare360AdmissionsChrome.tsx",
  "components/angelcare360/admissions/Angelcare360AdmissionsPageShell.tsx",
  "components/angelcare360/customer-foundation/AdmissionsEnrollmentCommand.module.css",
  "components/angelcare360/customer-foundation/AdmissionsEnrollmentCommand.tsx",
  "components/angelcare360/customer-foundation/DirectionExecutiveCommand.module.css",
  "components/angelcare360/customer-foundation/DirectionExecutiveCommand.tsx",
  "components/angelcare360/customer-foundation/FoundationDecisionComposer.module.css",
  "components/angelcare360/customer-foundation/FoundationDecisionComposer.tsx",
  "components/angelcare360/customer-foundation/FoundationPageShell.module.css",
  "components/angelcare360/customer-foundation/FoundationPlaneRail.module.css",
  "components/angelcare360/customer-foundation/FoundationPlaneRail.tsx",
  "components/angelcare360/customer-foundation/FoundationRouteChrome.module.css",
  "components/angelcare360/customer-foundation/FoundationRouteChrome.tsx",
  "components/angelcare360/customer-foundation/InstitutionalGovernanceCommand.module.css",
  "components/angelcare360/customer-foundation/InstitutionalGovernanceCommand.tsx",
  "components/angelcare360/customer-foundation/PeopleSovereignRegistry.module.css",
  "components/angelcare360/customer-foundation/PeopleSovereignRegistry.tsx",
  "components/angelcare360/people/Angelcare360PeopleChrome.tsx",
  "components/angelcare360/people/Angelcare360PeopleDossier.module.css",
  "components/angelcare360/people/Angelcare360PeopleDossier.tsx",
  "components/angelcare360/people/Angelcare360PeoplePageShell.tsx",
  "data/angelcare360/customer-foundation.ts",
  "lib/angelcare360/server/customer-foundation.ts",
  "scripts/verify-angelcare360-customer-mz2-foundation-operating-system.mjs",
  "supabase/migrations/20260802_angelcare360_customer_mz2_foundation_operating_system.sql",
  "types/angelcare360/customer-foundation.ts"
]
for(const r of requiredFiles){read(r);pass(`installed file: ${r}`)}
const prereq=[
 ['components/angelcare360/customer-experience/CustomerExperienceProvider.tsx','durationMs: input.durationMs ?? 3000'],
 ['components/angelcare360/customer-experience/CustomerOverlayPortal.tsx','createPortal'],
 ['components/angelcare360/customer-experience/CustomerPlaneNavigation.tsx','useSearchParams'],
 ['components/angelcare360/layout/Angelcare360Shell.tsx','CustomerExperienceProvider'],
 ['components/angelcare360/layout/Angelcare360Shell.tsx','CustomerFooter'],
 ['data/angelcare360/product-constitution.ts','ANGELCARE360_ROUTE_BINDINGS'],
 ['supabase/migrations/20260802_angelcare360_customer_mz1_product_constitution_experience_kernel.sql','angelcare360_operator_product_route_bindings']]
for(const [f,m] of prereq){if(!read(f).includes(m))fail(`Mega ZIP 1 prerequisite absent: ${f} :: ${m}`);pass(`Mega ZIP 1 prerequisite: ${m}`)}
const routes=[
  "app/(protected)/angelcare-360-command-center/(people)/eleves/[id]/page.tsx",
  "app/(protected)/angelcare-360-command-center/(people)/eleves/page.tsx",
  "app/(protected)/angelcare-360-command-center/(people)/enseignants/[id]/page.tsx",
  "app/(protected)/angelcare-360-command-center/(people)/enseignants/page.tsx",
  "app/(protected)/angelcare-360-command-center/(people)/parents/[id]/page.tsx",
  "app/(protected)/angelcare-360-command-center/(people)/parents/page.tsx",
  "app/(protected)/angelcare-360-command-center/(people)/personnel/[id]/page.tsx",
  "app/(protected)/angelcare-360-command-center/(people)/personnel/page.tsx",
  "app/(protected)/angelcare-360-command-center/(people)/personnes/affectations-classes/page.tsx",
  "app/(protected)/angelcare-360-command-center/(people)/personnes/audit/page.tsx",
  "app/(protected)/angelcare-360-command-center/(people)/personnes/contacts-urgence/page.tsx",
  "app/(protected)/angelcare-360-command-center/(people)/personnes/documents/page.tsx",
  "app/(protected)/angelcare-360-command-center/(people)/personnes/liens-parent-enfant/page.tsx",
  "app/(protected)/angelcare-360-command-center/(people)/personnes/page.tsx",
  "app/(protected)/angelcare-360-command-center/administration/affectations/page.tsx",
  "app/(protected)/angelcare-360-command-center/administration/annees-scolaires/page.tsx",
  "app/(protected)/angelcare-360-command-center/administration/audit/page.tsx",
  "app/(protected)/angelcare-360-command-center/administration/classes/page.tsx",
  "app/(protected)/angelcare-360-command-center/administration/etablissements/page.tsx",
  "app/(protected)/angelcare-360-command-center/administration/matieres/page.tsx",
  "app/(protected)/angelcare-360-command-center/administration/page.tsx",
  "app/(protected)/angelcare-360-command-center/administration/parametres/page.tsx",
  "app/(protected)/angelcare-360-command-center/administration/periodes/page.tsx",
  "app/(protected)/angelcare-360-command-center/administration/roles-permissions/page.tsx",
  "app/(protected)/angelcare-360-command-center/administration/sections/page.tsx",
  "app/(protected)/angelcare-360-command-center/admissions/audit/page.tsx",
  "app/(protected)/angelcare-360-command-center/admissions/conversions/page.tsx",
  "app/(protected)/angelcare-360-command-center/admissions/demandes/[id]/page.tsx",
  "app/(protected)/angelcare-360-command-center/admissions/demandes/page.tsx",
  "app/(protected)/angelcare-360-command-center/admissions/documents/page.tsx",
  "app/(protected)/angelcare-360-command-center/admissions/dossiers/[id]/page.tsx",
  "app/(protected)/angelcare-360-command-center/admissions/dossiers/page.tsx",
  "app/(protected)/angelcare-360-command-center/admissions/entretiens/page.tsx",
  "app/(protected)/angelcare-360-command-center/admissions/page.tsx",
  "app/(protected)/angelcare-360-command-center/admissions/pipeline/page.tsx",
  "app/(protected)/angelcare-360-command-center/direction/page.tsx"
]
for(const r of routes){if(!fs.existsSync(path.join(app,r)))fail(`in-scope route missing: ${r}`);pass(`in-scope route: ${r}`)}
if(routes.length!==36)fail(`expected 36 routes, found ${routes.length}`);pass('exact in-scope route count: 36')
const planeContract={
  "direction": [
    "today",
    "network",
    "decisions",
    "risks",
    "commitments",
    "performance",
    "calendar",
    "audit"
  ],
  "governance": [
    "institutions",
    "academic-structure",
    "classes-capacity",
    "subjects",
    "assignments",
    "roles-permissions",
    "settings",
    "audit"
  ],
  "people": [
    "registry",
    "students",
    "families",
    "teachers",
    "personnel",
    "relationships",
    "documents",
    "data-quality",
    "audit"
  ],
  "admissions": [
    "pipeline",
    "applications",
    "dossiers",
    "interviews",
    "documents",
    "decisions",
    "conversions",
    "audit"
  ]
}
const componentContract={
  "direction": "components/angelcare360/customer-foundation/DirectionExecutiveCommand.tsx",
  "governance": "components/angelcare360/customer-foundation/InstitutionalGovernanceCommand.tsx",
  "people": "components/angelcare360/customer-foundation/PeopleSovereignRegistry.tsx",
  "admissions": "components/angelcare360/customer-foundation/AdmissionsEnrollmentCommand.tsx"
}
const planeData=read('data/angelcare360/customer-foundation.ts')
for(const [domain,list] of Object.entries(planeContract)){
 const component=read(componentContract[domain])
 for(const plane of list){
  if(!planeData.includes(`key: '${plane}'`))fail(`plane registry missing: ${domain}/${plane}`)
  if(!planeData.includes(`?plane=${plane}`))fail(`plane URL missing: ${domain}/${plane}`)
  if(plane!==list[0]&&!component.includes(`'${plane}'`))fail(`plane renderer marker missing: ${domain}/${plane}`)
  pass(`horizontal plane wired: ${domain}/${plane}`)
 }}
pass('33 horizontal operating planes registered')
const doctrine=[
 ['components/angelcare360/customer-foundation/FoundationRouteChrome.tsx','Contexte tenant sécurisé'],
 ['components/angelcare360/customer-foundation/FoundationDecisionComposer.tsx','CustomerOverlayPortal'],
 ['components/angelcare360/customer-foundation/FoundationDecisionComposer.tsx','useCustomerExperience'],
 ['components/angelcare360/customer-foundation/FoundationDecisionComposer.tsx','router.refresh()'],
 ['components/angelcare360/customer-foundation/FoundationPageShell.module.css','width:100%'],
 ['components/angelcare360/people/Angelcare360PeopleDossier.tsx','Communications'],
 ['components/angelcare360/people/Angelcare360PeopleDossier.tsx','Audit'],
 ['components/angelcare360/admissions/Angelcare360AdmissionDossier.tsx','Conversion'],
 ['components/angelcare360/admissions/Angelcare360AdmissionDossier.tsx','Décision et conversion']]
for(const [f,m] of doctrine){if(!read(f).includes(m))fail(`doctrine marker absent: ${f} :: ${m}`);pass(`frontend doctrine: ${m}`)}
const tsFiles=[
  "app/(protected)/angelcare-360-command-center/(people)/layout.tsx",
  "app/(protected)/angelcare-360-command-center/(people)/personnes/page.tsx",
  "app/(protected)/angelcare-360-command-center/administration/page.tsx",
  "app/(protected)/angelcare-360-command-center/admissions/page.tsx",
  "app/(protected)/angelcare-360-command-center/direction/page.tsx",
  "app/api/angelcare360/customer-foundation/route.ts",
  "components/angelcare360/administration/Angelcare360AdminPageShell.tsx",
  "components/angelcare360/administration/Angelcare360AdministrationChrome.tsx",
  "components/angelcare360/admissions/Angelcare360AdmissionDossier.tsx",
  "components/angelcare360/admissions/Angelcare360AdmissionsChrome.tsx",
  "components/angelcare360/admissions/Angelcare360AdmissionsPageShell.tsx",
  "components/angelcare360/customer-foundation/AdmissionsEnrollmentCommand.tsx",
  "components/angelcare360/customer-foundation/DirectionExecutiveCommand.tsx",
  "components/angelcare360/customer-foundation/FoundationDecisionComposer.tsx",
  "components/angelcare360/customer-foundation/FoundationPlaneRail.tsx",
  "components/angelcare360/customer-foundation/FoundationRouteChrome.tsx",
  "components/angelcare360/customer-foundation/InstitutionalGovernanceCommand.tsx",
  "components/angelcare360/customer-foundation/PeopleSovereignRegistry.tsx",
  "components/angelcare360/people/Angelcare360PeopleChrome.tsx",
  "components/angelcare360/people/Angelcare360PeopleDossier.tsx",
  "components/angelcare360/people/Angelcare360PeoplePageShell.tsx",
  "data/angelcare360/customer-foundation.ts",
  "lib/angelcare360/server/customer-foundation.ts",
  "types/angelcare360/customer-foundation.ts"
]
for(const r of tsFiles){const source=read(r);const result=ts.transpileModule(source,{fileName:r,reportDiagnostics:true,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,moduleResolution:ts.ModuleResolutionKind.Bundler,jsx:ts.JsxEmit.Preserve,isolatedModules:true,esModuleInterop:true,allowSyntheticDefaultImports:true,skipLibCheck:true}});const errors=(result.diagnostics||[]).filter(d=>d.category===ts.DiagnosticCategory.Error);if(errors.length)fail(`isolated syntax: ${r}: ${errors.map(d=>ts.flattenDiagnosticMessageText(d.messageText,' ')).join(' | ')}`);pass(`isolated syntax: ${r}`)}
const cssFiles=[]
for(const r of tsFiles.filter(x=>x.endsWith('.tsx'))){const source=read(r);const regex=/import\s+styles\s+from\s+['\"]([^'\"]+\.module\.css)['\"]/g;let m;while((m=regex.exec(source))){let cr=m[1].startsWith('@/')?m[1].slice(2):path.relative(app,path.resolve(path.dirname(path.join(app,r)),m[1]));const css=read(cr);cssFiles.push(cr);const classes=new Set([...css.matchAll(/\.([A-Za-z_][A-Za-z0-9_-]*)/g)].map(x=>x[1]));const used=new Set([...source.matchAll(/\bstyles\.([A-Za-z_][A-Za-z0-9_]*)/g)].map(x=>x[1]));for(const name of used)if(!classes.has(name))fail(`CSS class missing: ${cr} .${name}`);pass(`CSS references: ${r}`)}}
for(const cr of [...new Set(cssFiles)]){const css=read(cr);if((css.match(/\{/g)||[]).length!==(css.match(/\}/g)||[]).length)fail(`CSS braces unbalanced: ${cr}`);if(/^\s*\[data-[^\]]+\][^{]*\{/m.test(css))fail(`impure CSS selector: ${cr}`);pass(`CSS purity: ${cr}`)}
const forbidden=['href="javascript:',"href='javascript:",'TODO_ACTION','onClick={() => {}}','alert(']
for(const r of requiredFiles.filter(x=>/\.(ts|tsx|js|mjs)$/.test(x)&&!x.includes('verify-angelcare360-customer-mz2'))){const source=read(r);for(const marker of forbidden)if(source.includes(marker))fail(`forbidden marker ${marker}: ${r}`)}
pass('dead-control markers absent')
for(const r of requiredFiles.filter(x=>x.includes('customer-foundation')||x.includes('AdministrationChrome')||x.includes('PeopleChrome')||x.includes('AdmissionsChrome'))){if(read(r).includes('OverheadPanel'))fail(`Operator OverheadPanel leakage: ${r}`)}
pass('Operator OverheadPanel leakage absent')
const sql=read('supabase/migrations/20260802_angelcare360_customer_mz2_foundation_operating_system.sql')
const tables=['angelcare360_customer_management_decisions','angelcare360_customer_readiness_snapshots','angelcare360_people_duplicate_cases','angelcare360_admission_conversion_runs','angelcare360_customer_saved_views']
for(const table of tables){if(!sql.includes(`create table if not exists public.${table}`))fail(`SQL table missing: ${table}`);if(!sql.includes(`alter table public.${table} enable row level security`))fail(`RLS missing: ${table}`);pass(`SQL table and RLS: ${table}`)}
for(const marker of ['drop table','truncate ','delete from '])if(sql.toLowerCase().includes(marker))fail(`destructive SQL: ${marker}`)
pass('destructive SQL absent')
if(!sql.trim().startsWith('begin;')||!sql.trim().endsWith('commit;'))fail('SQL transaction boundary missing')
pass('SQL transaction boundary')
console.log(`\n${checks} surgical checks passed. Mega ZIP 2 Direction, Governance, People & Admissions is structurally accepted.`)
