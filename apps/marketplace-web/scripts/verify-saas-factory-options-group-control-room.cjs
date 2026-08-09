const fs = require('fs')
const path = require('path')
const root = process.cwd()
const files = [
  'components/saas-factory/options/SaasFactoryOptionsCommandCenter.tsx',
  'lib/saas-factory/options-runtime.ts',
  'app/api/saas-factory/options/summary/route.ts',
  'app/api/saas-factory/options/actions/route.ts',
  'database/20260530_saas_factory_options_group_control_room.sql',
]
const failures = []
for (const file of files) if (!fs.existsSync(path.join(root, file))) failures.push(`Missing ${file}`)
const component = fs.existsSync(path.join(root, files[0])) ? fs.readFileSync(path.join(root, files[0]), 'utf8') : ''
for (const token of ['Group Clearance', 'Group Control Room', 'Existing options in targeted group', 'Group clearance policy', 'Smart templates from this group', 'Add option to targeted group', 'Module / Page / Modal targeting', 'remove_option_from_group', 'add_option_to_group']) {
  if (!component.includes(token)) failures.push(`Missing UI token: ${token}`)
}
const runtime = fs.existsSync(path.join(root, files[1])) ? fs.readFileSync(path.join(root, files[1]), 'utf8') : ''
for (const token of ['groupPolicies', 'optionTemplates', 'add_option_to_group', 'remove_option_from_group', 'groupPolicy', 'recommendedAdditions', 'conflicts']) {
  if (!runtime.includes(token)) failures.push(`Missing runtime token: ${token}`)
}
if (failures.length) {
  console.error('Options group control verification failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}
console.log('Options group control verification passed.')
