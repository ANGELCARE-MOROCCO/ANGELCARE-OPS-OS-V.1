const fs = require('fs')
const path = require('path')
const root = process.cwd()
const files = [
  'app/(protected)/saas-factory-command/actions/page.tsx',
  'components/saas-factory/actions/SaasFactoryActionsCommandCenter.tsx',
  'lib/saas-factory/actions-runtime.ts',
  'app/api/saas-factory/actions/summary/route.ts',
  'app/api/saas-factory/actions/execute/route.ts',
  'app/api/saas-factory/actions/export/route.ts',
  'database/20260530_saas_factory_actions_operational_upgrade.sql',
]
const failures = []
for (const file of files) if (!fs.existsSync(path.join(root, file))) failures.push(`Missing ${file}`)
const component = fs.existsSync(path.join(root, files[1])) ? fs.readFileSync(path.join(root, files[1]), 'utf8') : ''
for (const token of ['Action Control Room','Dry-run preview','Execute with audit','Dependency Graph','Policy Matrix','Execution Evidence','Rollback Center','Safety Gates']) if (!component.includes(token)) failures.push(`Component missing token: ${token}`)
const runtime = fs.existsSync(path.join(root, files[2])) ? fs.readFileSync(path.join(root, files[2]), 'utf8') : ''
for (const token of ['requiresDryRun','dependencies','blockers','dry_run','affectedModules','rollbackPlan']) if (!runtime.includes(token)) failures.push(`Runtime missing token: ${token}`)
for (const rel of ['summary','execute','export']) {
  const file = path.join(root, `app/api/saas-factory/actions/${rel}/route.ts`)
  if (fs.existsSync(file) && !fs.readFileSync(file, 'utf8').includes('../../../../../lib/saas-factory/actions-runtime')) failures.push(`${rel} route has wrong runtime import`)
}
if (failures.length) {
  console.error('Actions operational verification failed:')
  for (const f of failures) console.error(`- ${f}`)
  process.exit(1)
}
console.log('Actions operational verification passed.')
