#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const app = path.resolve(process.argv[2] || process.cwd())
let pass = 0
let fail = 0
const results = []
function ok(condition, label) { if (condition) { pass++; results.push(`PASS — ${label}`) } else { fail++; results.push(`FAIL — ${label}`) } }
function read(rel) { const p = path.join(app, rel); return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '' }
function exists(rel) { return fs.existsSync(path.join(app, rel)) }

const routes = [
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
for (const rel of routes) ok(exists(rel), `route exists: ${rel}`)

const components = [
  'MaterialCommandShell','BarcodeLookup','SanilaMaterialCommand','CategoryTaxonomyStudio','ArticleRegistry',
  'MovementStudio','MovementCommand','MaterialDossier','StewardshipMatrix',
]
for (const name of components) ok(exists(`components/angelcare360/material-command/${name}.tsx`), `Material Control component exists: ${name}`)
ok(exists('components/angelcare360/material-command/MaterialCommand.module.css'), 'Material Control CSS module exists')
ok(exists('types/angelcare360/material-control-css-modules.d.ts'), 'Material CSS module declaration exists')
ok(exists('lib/angelcare360/server/inventory-material-command.ts'), 'Material server authority adapter exists')
ok(exists('app/api/angelcare360/inventory-command/route.ts'), 'Material command API exists')
ok(exists('types/angelcare360/material-control.ts'), 'Material command types exist')
ok(exists('tsconfig.sanila-material-command.json'), 'Targeted Material TypeScript config exists')

const server = read('lib/angelcare360/server/inventory-material-command.ts')
const api = read('app/api/angelcare360/inventory-command/route.ts')
const css = read('components/angelcare360/material-command/MaterialCommand.module.css')
const ui = components.map(name => read(`components/angelcare360/material-command/${name}.tsx`)).join('\n') + routes.map(read).join('\n')

ok(server.includes("category: 'inventory'"), 'canonical inventory audit category preserved')
ok(server.includes("client.rpc(MOVEMENT_FUNCTION"), 'stock movements use atomic inventory RPC')
ok(!/from\('angelcare360_inventory_movements'\)\.insert/.test(server), 'no direct movement insert fallback exists')
ok(server.includes('inventory_negative_stock_blocked'), 'negative stock authority is explicitly handled')
ok(server.includes("reason === 'legacy_restrictive_movement_constraint_present'"), 'fresh-schema compatible legacy constraint is reconciled without SQL')
ok(server.includes("inventory-material-command-v1-compatible-constraint"), 'compatibility authority version is explicit')
ok(server.includes("movementType === 'transfer'"), 'transfer receives special truth treatment')
ok(server.includes('journal_only_no_location_balance'), 'transfer truth declares no location balance authority')
ok(server.includes('lookupMaterialByBarcode'), 'barcode lookup is real')
ok(server.includes('responsible_staff_id'), 'real responsibility authority wired')
ok(server.includes('Math.max(0, currentStock) * Math.max(0, purchasePrice)'), 'indicative value remains mathematical and non-accounting')
ok(api.includes("mode === 'barcode'"), 'API exposes barcode lookup')
ok(api.includes("body.entity === 'movement'"), 'API exposes governed movement command')
ok(api.includes("body.entity === 'item' && body.operation === 'assign'"), 'API exposes stewardship command')

const signatures = [
  'MATERIAL WATCHTOWER','TODAY MOVEMENT PULSE','MATERIAL READINESS FIELD','CATEGORY CONSTELLATION','MOVEMENT RIVER',
  'MATERIAL CONTROL DOSSIER','Vue opérationnelle','MATERIAL CHRONICLE','STEWARDSHIP','LOCATION TRUTH',
  'MATERIAL MOVEMENT COMMAND','CONSÉQUENCE AVANT ENREGISTREMENT','REPLENISHMENT & EXCEPTION COMMAND',
  'MATERIAL FORENSICS','MATERIAL STEWARDSHIP MATRIX','MATERIAL TAXONOMY STUDIO','MOVEMENT CHAMBER',
]
for (const signature of signatures) ok(ui.includes(signature), `signature experience present: ${signature}`)

ok(ui.includes('Aucun flux vidéo n’est stocké'), 'camera privacy truth is explicit')
ok(ui.includes('getTracks().forEach'), 'camera tracks are stopped')
ok(ui.includes('BarcodeDetector'), 'progressive browser barcode capability is used')
ok(ui.includes('saisie manuelle'), 'barcode manual fallback remains available')
ok(ui.includes('non comptable'), 'indicative value avoids accounting claims')
ok(ui.includes('aucune balance par emplacement') || ui.includes('balance de stock par emplacement'), 'location truth avoids fake physical stock authority')
ok(ui.includes('le serveur reste l’autorité finale') || ui.includes('Le serveur et l’autorité atomique déterminent'), 'server remains final stock authority')
ok(!ui.toLowerCase().includes('prévision automatique'), 'no fake automatic stock forecast claim')
ok(!/commande fournisseur automatique\s+(activée|active|opérationnelle|disponible)/i.test(ui), 'no fake automatic procurement claim')

// CSS module reference integrity
const classDefs = new Set([...css.matchAll(/\.([A-Za-z_][A-Za-z0-9_-]*)/g)].map(match => match[1]))
const classRefs = new Set([...ui.matchAll(/styles\.([A-Za-z_][A-Za-z0-9_]*)/g)].map(match => match[1]))
const missingCss = [...classRefs].filter(name => !classDefs.has(name)).sort()
ok(missingCss.length === 0, `CSS module references resolve${missingCss.length ? `: ${missingCss.join(', ')}` : ''}`)
ok(css.includes('@media(max-width:760px)'), 'mobile breakpoint present')
ok(css.includes('@media(max-width:1180px)'), 'tablet/laptop breakpoint present')
ok(css.includes('@media(prefers-reduced-motion:reduce)'), 'reduced-motion fallback present')
ok(css.includes(':focus-visible'), 'visible keyboard focus styling present')
ok(css.includes('.drawerBackdrop'), 'deep operational drawer visual system present')
ok(css.includes('.operatorStrip'), 'material readiness instrument system present')
ok(css.includes('.operationsGrid'), 'watchtower/today operations layout present')
ok(css.includes('.dossierTabs'), 'dossier in-page navigation system present')
ok(css.includes('.registryCards'), 'mobile registry cards present')

const tsconfig = JSON.parse(read('tsconfig.sanila-material-command.json') || '{}')
ok(tsconfig.compilerOptions?.incremental === false, 'targeted TypeScript incremental cache disabled')
ok(Array.isArray(tsconfig.include) && tsconfig.include.length === 0, 'targeted tsconfig disables repository-wide include')
ok(Array.isArray(tsconfig.files) && tsconfig.files.includes('next-env.d.ts'), 'targeted TypeScript includes Next environment types')
ok(Array.isArray(tsconfig.files) && tsconfig.files.includes('types/angelcare360/material-control-css-modules.d.ts'), 'targeted TypeScript includes CSS module declaration')
for (const forbidden of ['components/carelink/','components/hr-production/','components/service-os/','angelcare-marketplace/']) {
  ok(!(tsconfig.files || []).some(file => file.includes(forbidden)), `targeted TypeScript excludes ${forbidden}`)
}

const forbiddenDebt = ['TODO','FIXME','coming soon','mock data','fake forecast','fake warehouse','setInterval(']
for (const debt of forbiddenDebt) ok(!ui.toLowerCase().includes(debt.toLowerCase()), `forbidden UI debt absent: ${debt}`)

const oldImports = ['Angelcare360InventoryMutationForm','Angelcare360InventoryPageShell','Angelcare360InventoryRiskPanel','Angelcare360InventoryHub','InventorySectionScreen']
for (const name of oldImports) ok(!ui.includes(name), `old beta component not reused: ${name}`)

for (const rel of routes.filter(route => route.endsWith('page.tsx'))) {
  const source = read(rel)
  ok(source.includes('MaterialCommandShell') || source.includes('SanilaMaterialCommand'), `route participates in Material & Asset Control universe: ${rel}`)
}

console.log(results.join('\n'))
console.log(`\n${pass}/${pass + fail} checks passed. SANILA Material & Asset Control OS static contract ${fail ? 'FAILED' : 'accepted'}.`)
if (fail) process.exit(1)
