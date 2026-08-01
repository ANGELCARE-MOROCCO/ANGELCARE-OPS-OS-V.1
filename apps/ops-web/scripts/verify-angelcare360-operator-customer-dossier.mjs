#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const root = process.cwd()
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8')
const files = {
  route: 'app/(protected)/angelcare-360-operator/clients/[id]/page.tsx',
  notFound: 'app/(protected)/angelcare-360-operator/clients/[id]/not-found.tsx',
  contract: 'components/angelcare360/operator/customer-dossier/CustomerDossierContract.ts',
  room: 'components/angelcare360/operator/customer-dossier/CustomerRelationshipCommandRoom.tsx',
  scenes: 'components/angelcare360/operator/customer-dossier/CustomerDossierScenes.tsx',
  portals: 'components/angelcare360/operator/customer-dossier/CustomerDossierPortals.tsx',
  primitives: 'components/angelcare360/operator/customer-dossier/CustomerDossierPrimitives.tsx',
  css: 'components/angelcare360/operator/customer-dossier/CustomerRelationshipCommandRoom.module.css',
  sovereignPortal: 'components/angelcare360/operator/sovereign/SovereignPortal.tsx',
  tsc: 'tsconfig.angelcare360-operator-customer-dossier.json',
}
let passed = 0
const failures = []
function check(label, condition) {
  if (condition) { passed += 1; console.log(`PASS  ${label}`) }
  else { failures.push(label); console.error(`FAIL  ${label}`) }
}
for (const [label, rel] of Object.entries(files)) check(`file:${label}`, fs.existsSync(path.join(root, rel)))
const source = Object.fromEntries(Object.entries(files).filter(([,rel])=>fs.existsSync(path.join(root,rel))).map(([k,rel])=>[k,read(rel)]))
check('route uses dedicated Customer Relationship Command Room', source.route.includes('customer-dossier/CustomerRelationshipCommandRoom'))
check('route no longer imports Wave2 presentation room', !source.route.includes("wave2/CustomerRelationshipCommandRoom"))
check('route preserves authoritative Wave2 data contract', source.route.includes('loadWave2CustomerCommand'))
check('route passes explicit mutation capabilities', source.route.includes('CustomerDossierCapabilities'))
check('route supports stable section query', source.route.includes('searchParams') && source.route.includes('initialChapter'))
check('invalid customer gets dedicated not-found experience', source.notFound.includes('Dossier client introuvable'))

const chapters = ['overview','identity','contacts','institutions','product','commercial','finance','service','renewal','documents']
for (const chapter of chapters) check(`chapter:${chapter}`, source.contract.includes(`'${chapter}'`))
check('exactly ten chapter definitions', (source.contract.match(/\{ id: '/g) || []).length === 10)
check('compact customer command header', source.room.includes('customerCommandHeader'))
check('single intelligence ribbon architecture', source.room.includes('intelligenceRibbon'))
check('definitive dossier navigation', source.room.includes('dossierNavigation'))
check('three-plane command canvas', ['relationshipSpine','workingScene','intelligenceRail'].every((token)=>source.room.includes(token)))
check('context-aware action dock', source.room.includes('CustomerActionDock'))
check('management lenses are subordinate to overview', source.room.includes("chapter === 'overview'"))
check('customer context preserved in URL', source.room.includes('router.replace') && source.room.includes('?section='))

const scenes = ['OverviewScene','IdentityScene','ContactsScene','InstitutionsScene','ProductScene','CommercialScene','FinanceScene','ServiceScene','RenewalScene','DocumentsScene']
for (const scene of scenes) check(`scene:${scene}`, source.scenes.includes(`function ${scene}`))
check('operational twin exists', source.scenes.includes('Jumeau vivant de la relation'))
check('relationship graph is clickable', source.scenes.includes('RelationshipArchitecture'))
check('finance uses Dh formatter', source.scenes.includes('formatDh'))
check('service shows support and incidents', source.scenes.includes('Tickets support') && source.scenes.includes('Incidents'))
check('multi-contact gap is locked truthfully', source.scenes.includes('Registre multi-contacts non présent'))
check('institution creation gap is locked truthfully', source.scenes.includes('Création d’institution verrouillée'))
check('owner directory gap suppresses UUID input', source.scenes.includes('Aucun champ UUID n’est exposé'))

const portalKinds = ['edit-customer','edit-contact','intervention','support-ticket','confidential-note','lifecycle','archive','evidence','locked']
for (const kind of portalKinds) check(`portal-kind:${kind}`, source.contract.includes(`'${kind}'`))
const portalComponents = ['EditCustomerPortal','ContactPortal','InterventionPortal','SupportTicketPortal','ConfidentialNotePortal','LifecyclePortal','ArchivePortal','EvidencePortal']
for (const portal of portalComponents) check(`portal:${portal}`, source.portals.includes(`function ${portal}`))
check('portals use real SovereignPortal', source.portals.includes('<SovereignPortal'))
check('portal mounted at document.body', source.sovereignPortal.includes('createPortal(portal, document.body)'))
check('portal body scroll lock', source.sovereignPortal.includes("document.body.style.overflow = 'hidden'"))
check('portal focus restoration', source.sovereignPortal.includes('previousFocusRef'))
check('portal Escape handling', source.sovereignPortal.includes("event.key === 'Escape'"))
check('portal unsaved-change protection', source.sovereignPortal.includes('confirmClose'))
check('edit customer calls signed clients API', source.portals.includes("'/api/angelcare360/operator/clients'") && source.portals.includes("operation: 'update'"))
check('archive calls signed client archive operation', source.portals.includes("operation: 'archive'"))
check('ticket calls signed support API', source.portals.includes("'/api/angelcare360/operator/support'") && source.portals.includes("operation: 'create'"))
check('intervention calls signed service task API', source.portals.includes("entity: 'task'") && source.portals.includes("operation: 'create'"))
check('confidential note calls signed service note API', source.portals.includes("entity: 'note'") && source.portals.includes("visibility"))
check('no fake owner UUID field', !/name=["']ownerId["']/.test(source.portals))
check('no assignedTo technical field presented', !/label=["'][^"']*assigned/i.test(source.portals))
check('client mutations refresh server state', source.portals.includes('router.refresh()'))
check('API failures remain visible', source.portals.includes('portalError') && source.portals.includes('throw new Error'))
check('archive requires typed confirmation', source.portals.includes("=== 'ARCHIVER'"))
check('lifecycle transition requires reason', source.portals.includes('Raison, conditions et suivi requis'))

check('responsive three-plane collapse', source.css.includes('@media(max-width:980px)') && source.css.includes('grid-template-columns:1fr'))
check('mobile full command adaptation', source.css.includes('@media(max-width:680px)'))
check('reduced motion supported', source.css.includes('prefers-reduced-motion'))
check('sticky intelligence rail', source.css.includes('.intelligenceRail{position:sticky'))
check('sticky contextual dock', source.css.includes('.customerActionDock{position:fixed'))
check('raw UUID literal absent from dedicated files', !/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.test([source.room,source.scenes,source.portals,source.primitives,source.notFound].join('\n')))
check('no fake AI language', !/AI recommendation|intelligence artificielle inventée|autonomous adviser/i.test([source.room,source.scenes,source.portals].join('\n')))
check('only page-scoped CSS module used', source.room.includes('CustomerRelationshipCommandRoom.module.css'))

if (failures.length) {
  console.error(`\n${failures.length} failure(s); ${passed} check(s) passed.`)
  process.exit(1)
}
console.log(`\n${passed} checks passed. Customer dossier source contract accepted.`)
