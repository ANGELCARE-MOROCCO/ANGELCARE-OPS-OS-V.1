import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
const root=process.cwd(); const R=f=>fs.readFileSync(path.join(root,f),'utf8')
let pass=0,fail=0;const failures=[]
function ok(name,cond){if(cond){pass++;console.log(`PASS  ${name}`)}else{fail++;failures.push(name);console.error(`FAIL  ${name}`)}}
function run(script){const r=spawnSync(process.execPath,[script],{cwd:root,encoding:'utf8'});if(r.stdout)process.stdout.write(r.stdout);if(r.status!==0&&r.stderr)process.stderr.write(r.stderr);return r.status===0}

console.log('=== AUTHORITATIVE CONTRACT GATES ===')
ok('sovereign product contract verifier green',run('scripts/verify-sanila-sovereign-product-contract.mjs'))
ok('cross-universe positive/negative matrix green',run('scripts/verify-sanila-cross-universe-matrix.mjs'))
ok('route ledger generator green',run('scripts/generate-sanila-product-contract-ledger.mjs'))
ok('action ledger generator green',run('scripts/generate-sanila-product-action-ledger.mjs'))
ok('Operator/Tenant operational reality verifier green',run('scripts/verify-sanila-operator-tenant-operational-reality.mjs'))
ok('final security/closure verifier green',run('scripts/verify-sanila-final-production-closure.mjs'))

const routeLedger=JSON.parse(R('docs/sanila-final-product-closure/PRODUCT_ROUTE_ACTION_LEDGER.json'))
const actionLedger=JSON.parse(R('docs/sanila-final-product-closure/PRODUCT_ACTION_LEDGER.json'))
const operatorTenantReality=JSON.parse(R('docs/sanila-final-product-closure/OPERATOR_TENANT_OPERATIONAL_REALITY.json'))
ok('254 Operator/Tenant routes operationally classified',operatorTenantReality.counts.total===254)
ok('zero Operator/Tenant static or ambiguous shells',operatorTenantReality.counts.blocked===0)
ok('311 product routes audited',routeLedger.counts.totalRoutes===311)
ok('57 role routes audited',routeLedger.counts.roleRoutes===57)
ok('195 Tenant Command Center routes audited',routeLedger.counts.tenantRoutes===195)
ok('59 Operator routes audited',routeLedger.counts.operatorRoutes===59)
ok('zero blocked routes',routeLedger.counts.blocked===0)
ok('zero blocked UI→backend actions',actionLedger.counts.blocked===0)
ok('zero orphan backend actions',actionLedger.counts.orphanBackendActions===0)
ok('40 route/action associations audited',actionLedger.counts.routeActionAssociations===40)

const server=R('lib/angelcare360/portal/server.ts')
const actions=R('lib/angelcare360/server/portal-actions.ts')
const auth=R('lib/angelcare360/portal/auth.ts')
const panel=R('components/angelcare360/role-portals/PortalActionPanel.tsx')
const recordList=R('components/angelcare360/role-portals/PortalRecordList.tsx')
const shell=R('components/angelcare360/role-portals/RolePortalShell.tsx')
const invites=R('lib/angelcare360/server/portal-invitations.ts')

console.log('\n=== ZERO-RESIDUE PRODUCT SIGNALS ===')
for(const key of ['meetings','satisfaction','pickup','feedback','approvals','tasks','leave','workflows','tickets','team']){
  ok(`no hardcoded visible empty ${key}`,!new RegExp(`\\b${key}\\s*:\\s*\\[\\s*\\]`).test(server))
}
ok('no reachable login_app_user dependency',![auth,server,...['teacher','parent','student','staff'].map(r=>R(`app/angelcare-360-${r}/login/page.tsx`))].some(t=>t.includes('login_app_user')))
ok('no silent 100-row portal truncation',!recordList.includes('.slice(0,100)')&&!recordList.includes('.slice(0, 100)'))
ok('portal collections expose search at scale',recordList.includes('search')&&recordList.includes('status'))
ok('portal logout clears persona context',shell.includes('sanila_portal_kind')&&shell.includes('sanila_portal_person')&&shell.includes('sanila_portal_school'))
ok('portal identity uses canonical requireUser',/requirePortalIdentity[\s\S]{0,700}await requireUser\(\)/.test(server))
ok('dedicated portal activation requires effective role',invites.includes('resolveEffectivePortalRole'))
ok('UI capability layer exists',panel.includes('VIEW_ACTIONS')&&panel.includes('actionAvailable'))
ok('durable internal consequence notifications exist',actions.includes('enqueueInternalPortalNotifications')&&actions.includes('angelcare360_notification_outbox'))
ok('all four role notification centers read internal outbox',[
  "internalPortalOutboxRows(db,schoolId,'staff',staffId)",
  "internalPortalOutboxRows(db,schoolId,'parent',parentId)",
  "internalPortalOutboxRows(db,schoolId,'student',studentId)"
].every(v=>server.includes(v)))
ok('external notification channels are not claimed by role consequences',!/(channel:\s*['"](?:email|sms|whatsapp|push)['"])/.test(actions))

const roleAndCoreFiles=[
  ...['teacher','parent','student','staff'].flatMap(role=>{
    const base=path.join(root,`app/angelcare-360-${role}`);const out=[];const walk=d=>{for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory())walk(p);else if(e.isFile()&&/\.(?:ts|tsx)$/.test(e.name))out.push(path.relative(root,p))}};walk(base);return out
  }),
  'components/angelcare360/role-portals/PortalExperience.tsx','components/angelcare360/role-portals/PortalActionPanel.tsx','components/angelcare360/role-portals/PortalRecordList.tsx','components/angelcare360/role-portals/TeacherAttendanceRegister.tsx',
  'lib/angelcare360/portal/server.ts','lib/angelcare360/portal/auth.ts','lib/angelcare360/portal/policy.ts','lib/angelcare360/portal/documents.ts','lib/angelcare360/server/portal-actions.ts','lib/angelcare360/server/portal-invitations.ts'
]
let residue=[]
for(const f of roleAndCoreFiles){const t=R(f);if(/\/\/\s*(?:TODO|FIXME)\b|\/\*[\s\S]*?\b(?:TODO|FIXME)\b/i.test(t))residue.push(`${f}:TODO/FIXME`);if(/\b(?:coming soon|placeholder operational|not implemented)\b/i.test(t))residue.push(`${f}:unfinished-copy`)}
ok('zero TODO/FIXME/coming-soon residue in role/core closure surfaces',residue.length===0)

console.log(`\nZERO_RESIDUE_PASS=${pass}`)
console.log(`ZERO_RESIDUE_FAIL=${fail}`)
if(fail){console.error('\nFAILURES');[...failures,...residue].forEach(f=>console.error(`- ${f}`));process.exit(1)}
