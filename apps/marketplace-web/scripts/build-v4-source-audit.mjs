import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const adminRoot = path.join(root, 'app/angelcare-marketplace/(protected)/admin')
const apiRoot = path.join(root, 'app/api/angelcare-marketplace')
const mappingRoot = path.join(root, 'docs/admin-design')
const out = path.join(root, 'docs/marketplace-admin-finalization')
const csv = value => `"${String(value ?? '').replaceAll('"', '""')}"`
const walk = (dir, test, result = []) => { if (!fs.existsSync(dir)) return result; for (const e of fs.readdirSync(dir, { withFileTypes: true })) { const f = path.join(dir, e.name); if (e.isDirectory()) walk(f, test, result); else if (test(f)) result.push(f) } return result.sort() }
const pages = walk(adminRoot, f => f.endsWith('/page.tsx'))
const apis = walk(apiRoot, f => f.endsWith('/route.ts'))
const mappings = walk(mappingRoot, f => /^BATCH_\d+_SOURCE_MAPPING\.txt$/.test(path.basename(f))).filter(f => !f.includes('ANGELCARE_'))
const mappingText = mappings.map(file => ({ file, batch: Number(path.basename(file).match(/BATCH_(\d+)/)[1]), text: fs.readFileSync(file, 'utf8') }))
const routeFor = (file, base, prefix) => { let r = path.relative(base, path.dirname(file)).split(path.sep).join('/'); r = r.replaceAll('/(protected)', '').replaceAll('/[', '/:').replaceAll(']', ''); return `${prefix}${r && r !== '.' ? `/${r}` : ''}` }
const sourceMeta = text => ({ exports: [...text.matchAll(/export\s+(?:async\s+)?(?:function|const|class|type|interface)\s+([\w$]+)/g)].map(x => x[1]).join('|') || 'NONE', imports: [...text.matchAll(/from\s+["']([^"']+)["']/g)].map(x => x[1]).join('|') || 'NONE', refs: [...text.matchAll(/@\/angelcare-marketplace\/([\w./-]+)/g)].map(x => x[1]).join('|') || 'NONE', authorities: [...text.matchAll(/(?:repository|service|authority|Repository|Service)[\w$]*/g)].map(x => x[0]).filter((x, i, a) => a.indexOf(x) === i).join('|') || 'NONE', redirects: [...text.matchAll(/(?:redirect|permanentRedirect)\s*\([^)]*["']([^"']+)["']/g)].map(x => x[1]).join('|') || 'NONE' })
const comparable = route => route.replaceAll(/:[^/]+/g, '[id]')
const batchFor = route => mappingText.filter(x => x.text.split(/\r?\n/).some(line => line.includes(route) || line.includes(comparable(route)))).map(x => `B${String(x.batch).padStart(2,'0')}`).join('|') || 'UNMAPPED'
const raw = [['source_item_id','source_kind','source_file','route','batch_mapping','exported_symbols','imports','referenced_components','repository_service_symbols','redirect_information','operator_relevance','capability_ids','review_status']]
for (const file of pages) { const text = fs.readFileSync(file, 'utf8'); const r = routeFor(file, adminRoot, '/angelcare-marketplace/admin'); const m = sourceMeta(text); raw.push([`PAGE-${raw.length}`, 'ADMIN_PAGE', path.relative(root, file).split(path.sep).join('/'), r, batchFor(r), m.exports, m.imports, m.refs, m.authorities, m.redirects, 'UNREVIEWED', 'UNREVIEWED', 'UNREVIEWED']) }
for (const file of apis) { const text = fs.readFileSync(file, 'utf8'); const r = routeFor(file, apiRoot, '/api/angelcare-marketplace'); const m = sourceMeta(text); raw.push([`API-${raw.length}`, 'API_ROUTE', path.relative(root, file).split(path.sep).join('/'), r, batchFor(r), m.exports, m.imports, m.refs, m.authorities, m.redirects, 'UNREVIEWED', 'UNREVIEWED', 'UNREVIEWED']) }
fs.mkdirSync(out, { recursive: true })
fs.writeFileSync(path.join(out, 'ADMIN_RAW_SOURCE_INVENTORY.csv'), raw.map(row => row.map(csv).join(',')).join('\n') + '\n')

const capabilities = [['capability_id','batch','canonical_workspace','capability_family','capability_name','operator_purpose','canonical_route','interaction_surface','source_pages','source_components','source_api_routes','repository_service_authority','mutation_authority','lifecycle_authority','permission_authority','related_objects','downstream_effects','approved_design_reference','disposition','implementation_status','verification_status','source_review_status','evidence_notes']]
const workspaceForBatch = {1:'Produits & services',2:'Catégories & collections',3:'Clients',4:'Commandes & réservations',5:'Boutique',6:'Marketing & promotions',7:'Opérations',8:'Prestataires & fournisseurs',9:'Academy / B2B & partenaires',10:'Finance',11:'Trust & qualité / Analytics & intelligence / Paramètres & gouvernance'}
const capabilityMarkers = /CAPABILITIES|ACTIONS|CREATE ACTION|EXECUTION|TRANSITION|MUTATION|ROLLBACK|DISPOSITION|DECISION/i
for (const { batch, file, text } of mappingText) {
  const lines = text.split(/\r?\n/); let marker = false; let route = 'UNREVIEWED'; let ordinal = 0
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim(); if (/^\/?(?:api\/)?angelcare-marketplace\//.test(line) || /^ROUTE:\s*\//.test(line)) route = line.replace(/^ROUTE:\s*/, '')
    if (capabilityMarkers.test(line)) marker = true
    else if (/^={3,}|^-{3,}|^\d+\./.test(line)) marker = false
    if (!marker || !/^[-*]\s+\S/.test(line)) continue
    const name = line.replace(/^[-*]\s+/, '').replace(/\s+/g, ' ').trim(); if (name.length < 3 || /^no\s/i.test(name)) continue
    const id = `CAP-B${String(batch).padStart(2,'0')}-${String(++ordinal).padStart(3,'0')}`
    const window = lines.slice(Math.max(0, i - 30), i + 1).join('\n')
    const componentRefs = [...window.matchAll(/(?:angelcare-marketplace|app\/angelcare-marketplace)[^\s,)]+\.(?:tsx?|json)/g)].map(x => x[0]).join('|') || 'NOT_APPLICABLE'
    const apiRefs = [...window.matchAll(/\/api\/angelcare-marketplace[^\s,)]+/g)].map(x => x[0]).join('|') || 'NOT_APPLICABLE'
    const permissions = [...window.matchAll(/marketplace\.[a-z0-9_.-]+/gi)].map(x => x[0]).filter((x,j,a)=>a.indexOf(x)===j).join('|') || 'PERMISSION_AUTHORITY_NOT_FOUND'
    const sourceExists = componentRefs !== 'NOT_APPLICABLE' && componentRefs.split('|').some(ref => fs.existsSync(path.join(root, ref.replace(/^app\//, 'app/'))))
    capabilities.push([id, `B${String(batch).padStart(2,'0')}`, workspaceForBatch[batch], 'Mapping-confirmed operator action', name, `Execute source-confirmed ${name}`, route, 'UNREVIEWED', 'UNREVIEWED', componentRefs, apiRefs, 'UNREVIEWED', 'UNREVIEWED', 'UNREVIEWED', permissions, 'UNREVIEWED', 'UNREVIEWED', `batch-${String(batch).padStart(2,'0')}`, 'UNREVIEWED', 'UNREVIEWED', 'UNREVIEWED', sourceExists ? 'SOURCE_REVIEWED' : 'UNREVIEWED', `Source mapping ${path.relative(root, file)} line ${i + 1}; source reference existence=${sourceExists ? 'confirmed' : 'not confirmed'}.`])
  }
}
fs.writeFileSync(path.join(out, 'ADMIN_CAPABILITY_EXHAUSTION_MATRIX.csv'), capabilities.map(row => row.map(csv).join(',')).join('\n') + '\n')

const routeDisposition = [['route','source_component','actual_behavior','redirect_target','batch','canonical_workspace','canonical_destination','disposition','capability_ids','review_status','evidence']]
for (const file of pages) { const text = fs.readFileSync(file, 'utf8'); const r = routeFor(file, adminRoot, '/angelcare-marketplace/admin'); routeDisposition.push([r, sourceMeta(text).exports, 'UNREVIEWED', 'UNREVIEWED', batchFor(r), 'UNREVIEWED', 'UNREVIEWED', 'UNREVIEWED', 'UNREVIEWED', 'UNREVIEWED', 'Source file inventory only.']) }
fs.writeFileSync(path.join(out, 'ADMIN_ROUTE_DISPOSITION.csv'), routeDisposition.map(row => row.map(csv).join(',')).join('\n') + '\n')

const apiMatrix = [['api_route','methods','handler_symbols','business_domain','capability_ids','permission_guard','read_write','mutation_type','operator_facing_indirectly','review_status','evidence']]
for (const file of apis) { const text = fs.readFileSync(file, 'utf8'); const r = routeFor(file, apiRoot, '/api/angelcare-marketplace'); apiMatrix.push([r, [...text.matchAll(/export\s+async\s+function\s+(GET|POST|PATCH|PUT|DELETE)/g)].map(x => x[1]).join('|') || 'UNREVIEWED', sourceMeta(text).exports, 'UNREVIEWED', 'UNREVIEWED', 'UNREVIEWED', 'UNREVIEWED', 'UNREVIEWED', 'UNREVIEWED', 'UNREVIEWED', 'Source file inventory only.']) }
fs.writeFileSync(path.join(out, 'ADMIN_API_AUTHORITY_MATRIX.csv'), apiMatrix.map(row => row.map(csv).join(',')).join('\n') + '\n')
console.log(`Raw source inventory: ${pages.length + apis.length} items; capability anchors: ${capabilities.length - 1}`)
