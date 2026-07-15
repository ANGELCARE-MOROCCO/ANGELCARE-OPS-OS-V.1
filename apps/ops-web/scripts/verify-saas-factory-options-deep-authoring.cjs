const fs = require('fs')
const path = require('path')
const root = process.cwd()
const files = [
  'components/saas-factory/options/SaasFactoryOptionsCommandCenter.tsx',
  'lib/saas-factory/options-runtime.ts',
  'app/api/saas-factory/options/summary/route.ts',
  'app/api/saas-factory/options/actions/route.ts',
  'app/api/saas-factory/options/export/route.ts',
  'database/20260530_saas_factory_options_deep_context_fields.sql',
]
const failures = []
for (const file of files) if (!fs.existsSync(path.join(root, file))) failures.push(`Missing ${file}`)
const component = fs.existsSync(path.join(root, files[0])) ? fs.readFileSync(path.join(root, files[0]), 'utf8') : ''
for (const token of ['Module Scope', 'Page Scope', 'Modal & Workflow Scope', 'Dependencies & Tags', 'Publish Gate', 'selectedPages', 'selectedModals', 'dependencyKeys', 'allowedValues', 'validationRule', 'rolloutStrategy']) {
  if (!component.includes(token)) failures.push(`Component missing deep authoring token: ${token}`)
}
const runtime = fs.existsSync(path.join(root, files[1])) ? fs.readFileSync(path.join(root, files[1]), 'utf8') : ''
for (const token of ['pageContexts', 'modalContexts', 'workflowContexts', 'dependencyGraph', 'pageScope', 'modalScope', 'workflowScope', 'runOptionsAction']) {
  if (!runtime.includes(token)) failures.push(`Runtime missing deep context token: ${token}`)
}
if (failures.length) {
  console.error('Options deep authoring verification failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}
console.log('Options deep authoring verification passed.')
