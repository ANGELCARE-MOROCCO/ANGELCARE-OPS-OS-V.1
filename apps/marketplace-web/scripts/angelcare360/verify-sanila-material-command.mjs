#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
const app = path.resolve(process.argv[2] || process.cwd())
let pass=0,fail=0
const results=[]
function ok(condition,label){if(condition){pass++;results.push(`PASS  ${label}`)}else{fail++;results.push(`FAIL  ${label}`)}}
function read(rel){const p=path.join(app,rel);return fs.existsSync(p)?fs.readFileSync(p,'utf8'):''}
function exists(rel){return fs.existsSync(path.join(app,rel))}
const routes=[
'app/(protected)/angelcare-360-command-center/inventaire/page.tsx',
'app/(protected)/angelcare-360-command-center/inventaire/categories/page.tsx',
'app/(protected)/angelcare-360-command-center/inventaire/categories/[id]/page.tsx',
'app/(protected)/angelcare-360-command-center/inventaire/articles/page.tsx',
'app/(protected)/angelcare-360-command-center/inventaire/articles/[id]/page.tsx',
'app/(protected)/angelcare-360-command-center/inventaire/mouvements/page.tsx',
'app/(protected)/angelcare-360-command-center/inventaire/mouvements/[id]/page.tsx',
'app/(protected)/angelcare-360-command-center/inventaire/stock-bas/page.tsx',
'app/(protected)/angelcare-360-command-center/inventaire/responsables/page.tsx',
'app/(protected)/angelcare-360-command-center/inventaire/audit/page.tsx',
'app/(protected)/angelcare-360-command-center/inventaire/loading.tsx',
'app/(protected)/angelcare-360-command-center/inventaire/error.tsx',
'app/(protected)/angelcare-360-command-center/inventaire/not-found.tsx',
]
for(const r of routes) ok(exists(r),`route exists: ${r}`)
const components=['MaterialCommandShell','BarcodeLookup','SanilaMaterialCommand','CategoryTaxonomyStudio','ArticleRegistry','MovementStudio','MovementCommand','MaterialDossier','StewardshipMatrix']
for(const c of components) ok(exists(`components/angelcare360/material-command/${c}.tsx`),`premium component exists: ${c}`)
ok(exists('components/angelcare360/material-command/MaterialCommand.module.css'),'precision material CSS exists')
ok(exists('lib/angelcare360/server/inventory-material-command.ts'),'material server authority adapter exists')
ok(exists('app/api/angelcare360/inventory-command/route.ts'),'material command API exists')
ok(exists('types/angelcare360/material-control.ts'),'material command types exist')
ok(exists('tsconfig.sanila-material-command.json'),'isolated TypeScript config exists')
const server=read('lib/angelcare360/server/inventory-material-command.ts')
const api=read('app/api/angelcare360/inventory-command/route.ts')
const css=read('components/angelcare360/material-command/MaterialCommand.module.css')
const allUi=components.map(c=>read(`components/angelcare360/material-command/${c}.tsx`)).join('\n')+routes.map(read).join('\n')
ok(server.includes("from '@/lib/angelcare360/server/context'"),'server uses direct context authority')
ok(server.includes("from '@/lib/angelcare360/server/audit'"),'server uses direct audit authority')
ok(!server.includes("from '@/lib/angelcare360/server'"),'server avoids broad AngelCare360 barrel')
ok(server.includes("client.rpc(MOVEMENT_FUNCTION"),'all stock movements use atomic RPC')
ok(!/from\('angelcare360_inventory_movements'\)\.insert/.test(server),'server has no direct movement insert fallback')
ok(!/current_stock\s*:/.test(server.slice(server.indexOf('export async function updateMaterialItem'),server.indexOf('export async function assignMaterialResponsible'))),'item metadata update cannot edit current_stock')
ok(server.includes('inventory_negative_stock_blocked'),'negative stock is explicitly blocked')
ok(server.includes("movementType === 'transfer'"),'transfer receives special integrity treatment')
ok(server.includes('journal_only_no_location_balance'),'transfer truth declares no location balance')
ok(server.includes('lookupMaterialByBarcode'),'barcode lookup is real')
ok(!server.includes('BLOCKED_BARCODE_MESSAGE'),'legacy barcode block removed')
ok(server.includes('responsible_staff_id'),'real staff responsibility wired')
ok(server.includes('reorderLevel > 0 ? currentStock / reorderLevel'),'threshold pressure computed from real fields')
ok(server.includes('Math.max(0, currentStock) * Math.max(0, purchasePrice)'),'indicative material value is mathematical only')
ok(api.includes("mode === 'barcode'"),'API exposes barcode lookup')
ok(api.includes("body.entity === 'movement'"),'API exposes controlled movement command')
ok(api.includes("body.entity === 'item' && body.operation === 'assign'"),'API exposes stewardship command')
const signatures=['MATERIAL COMMAND','MATERIAL READINESS FIELD','CATEGORY CONSTELLATION','MOVEMENT RIVER','Material Onboarding Studio','Movement Studio','MATERIAL DOSSIER','STOCK HORIZON','MATERIAL FORENSICS','MATERIAL STEWARDSHIP MATRIX','DEPLETION COMMAND','MATERIAL TAXONOMY STUDIO','MOVEMENT CHAMBER']
for(const s of signatures) ok(allUi.includes(s),`signature experience present: ${s}`)
const forbidden=['TODO','FIXME','coming soon','mock data','fake forecast','fake warehouse','window.location.reload','setInterval(']
for(const f of forbidden) ok(!allUi.toLowerCase().includes(f.toLowerCase()),`forbidden UI debt absent: ${f}`)
ok(allUi.includes('Aucun flux vidéo n’est stocké'),'camera privacy truth present')
ok(allUi.includes('getTracks().forEach'),'camera tracks are stopped')
ok(allUi.includes('BarcodeDetector'),'browser barcode capability used progressively')
ok(allUi.includes('saisie manuelle'),'scanner manual fallback present')
ok(allUi.includes('prix d’achat')||allUi.includes('Prix d’achat'),'purchase-price labeling present')
ok(allUi.includes('non comptable')||allUi.includes('non comptable'),'indicative value avoids accounting claim')
ok(css.includes('@media(max-width:760px)'),'mobile breakpoint present')
ok(css.includes('@media(max-width:1180px)'),'tablet/laptop breakpoint present')
ok(css.includes('@media(prefers-reduced-motion:reduce)'),'reduced-motion fallback present')
ok(css.includes(':focus-visible'),'visible keyboard focus present')
ok(css.includes('.dossierGrid'),'deep dossier layout present')
ok(css.includes('.readinessLanes'),'readiness spatial lanes present')
ok(css.includes('.stewardGrid'),'stewardship visual system present')
ok(css.includes('.auditRow'),'forensic audit visual system present')
const tsconfig=JSON.parse(read('tsconfig.sanila-material-command.json')||'{}')
ok(Array.isArray(tsconfig.include)&&tsconfig.include.length===0,'targeted tsconfig disables repository-wide include')
ok(Array.isArray(tsconfig.files)&&tsconfig.files.length>=25,'targeted tsconfig explicitly enumerates domain files')
for(const out of ['components/carelink/','components/hr-production/','components/service-os/','angelcare-marketplace/']) ok(!(tsconfig.files||[]).some(x=>x.includes(out)),`targeted TypeScript excludes ${out}`)
const oldImports=['Angelcare360InventoryMutationForm','Angelcare360InventoryPageShell','Angelcare360InventoryRiskPanel','Angelcare360InventoryHub','InventorySectionScreen']
for(const name of oldImports) ok(!allUi.includes(name),`old beta component not reused: ${name}`)
for(const r of routes.filter(r=>r.endsWith('page.tsx'))) ok(read(r).includes('MaterialCommandShell')||r.endsWith('/page.tsx')&&read(r).includes('SanilaMaterialCommand'),`route participates in Material Command visual universe: ${r}`)
console.log(results.join('\n'))
console.log(`\n${pass}/${pass+fail} checks passed. SANILA Inventory & Material Control OS static contract ${fail?'FAILED':'accepted'}.`)
if(fail) process.exit(1)
