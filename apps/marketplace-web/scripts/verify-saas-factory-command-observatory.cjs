const fs = require('fs')
const path = require('path')

const root = process.cwd()
const required = [
  'app/(protected)/saas-factory-command/observatory/page.tsx',
  'components/saas-factory/SaasFactoryCommandCenter.tsx',
  'lib/saas-factory/observatory.ts',
  'app/api/saas-factory/observatory/route.ts',
  'app/api/saas-factory/observatory/refresh/route.ts',
  'app/api/saas-factory/observatory/scan/route.ts',
  'app/api/saas-factory/observatory/diagnostics/route.ts',
  'app/api/saas-factory/observatory/probes/route.ts',
  'app/api/saas-factory/observatory/probes/[id]/route.ts',
  'app/api/saas-factory/observatory/export/route.ts',
  'app/api/saas-factory/audit/recent/route.ts',
  'app/api/saas-factory/modules/sync/route.ts',
  'app/api/saas-factory/system/actions/route.ts',
  'database/20260529_saas_factory_observatory_operationalization.sql',
  'scripts/smoke-saas-factory-command-observatory.cjs',
]

const forbiddenRoutes = ['phase9','phase10','phase11','phase12','phase13','phase14','mega']
const fail = (message) => { console.error(`✗ ${message}`); process.exitCode = 1 }
const pass = (message) => console.log(`✓ ${message}`)
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')

for (const file of required) fs.existsSync(path.join(root, file)) ? pass(file) : fail(`Missing ${file}`)

const routeRoot = path.join(root, 'app/(protected)')
if (fs.existsSync(routeRoot)) {
  const stack = [routeRoot]
  while (stack.length) {
    const current = stack.pop()
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name)
      if (entry.isDirectory()) stack.push(full)
      const rel = path.relative(root, full)
      if (forbiddenRoutes.some((bad) => rel.includes(`/saas-factory-command/${bad}`))) fail(`Forbidden route exists: ${rel}`)
    }
  }
  pass('No forbidden SaaS Factory phase/mega routes found')
}

const component = read('components/saas-factory/SaasFactoryCommandCenter.tsx')
const runtime = read('lib/saas-factory/observatory.ts')
const sql = read('database/20260529_saas_factory_observatory_operationalization.sql')

;[
  'ObservatoryOperationalModal',
  'openObservatoryModal',
  'runObservatoryModal',
  'Probe Matrix',
  'State-Generated Recommendations',
  'Queue Observability',
  'Incident Observatory',
  'Audit Timeline',
  'Source:',
  'disabledReason',
].forEach((needle) => component.includes(needle) ? pass(`Component contains ${needle}`) : fail(`Component missing ${needle}`))

;[
  'getObservatoryState',
  'runObservatoryScan',
  'runObservatoryDiagnostics',
  'getObservatoryProbe',
  'exportObservatory',
  'runObservatorySystemAction',
  'safe_block',
].forEach((needle) => runtime.includes(needle) ? pass(`Runtime contains ${needle}`) : fail(`Runtime missing ${needle}`))


;[
  'Probe execution center',
  'Diagnostic command matrix',
  'Probe evidence dossier',
  'Queue command center',
  'Incident command workflow',
  'Audit evidence explorer',
  'Registry reconciliation preview',
  'Remediation plan builder',
  'Export builder',
  'Production safety gate',
  'workflowModal',
  'workflowLayout',
  'workflowPanel',
].forEach((needle) => component.includes(needle) ? pass(`Unique workflow UX contains ${needle}`) : fail(`Unique workflow UX missing ${needle}`))

;[
  'Queue purge remains blocked',
  'remediation_plan',
  'owner: payload.owner',
  'safe_retry_only',
].forEach((needle) => runtime.includes(needle) ? pass(`Runtime action handling contains ${needle}`) : fail(`Runtime action handling missing ${needle}`))

if (/onClick=\{\s*\(\)\s*=>\s*\}/.test(component)) fail('Empty onClick handler found')
else pass('No empty onClick handlers found')
if (/console\.log\(/.test(component)) fail('console.log-only handler risk found in component')
else pass('No console.log handlers in Observatory component')
if (/alert\(/.test(component)) fail('alert-only fake handler found')
else pass('No alert handlers in Observatory component')
if (component.includes('98.7%</b><br/>SYSTEM HEALTH')) fail('Old static Observatory radar shell still present')
else pass('Old static Observatory shell removed from primary Observatory page')
if (!/create table if not exists public\.saas_factory_observatory_snapshots/.test(sql)) fail('SQL missing observatory snapshot table')
else pass('SQL has additive observatory snapshot support')
if (/drop table|truncate table/i.test(sql)) fail('Unsafe destructive SQL found')
else pass('No destructive SQL found')

if (process.exitCode) process.exit(process.exitCode)
console.log('\nSAAS FACTORY OBSERVATORY VERIFY PASSED')
