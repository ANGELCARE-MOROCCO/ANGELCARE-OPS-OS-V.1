const fs = require('fs')
const path = require('path')

const root = process.cwd()
const target = path.join(root, 'lib/saas-factory/options-runtime.ts')
const failures = []

if (!fs.existsSync(target)) {
  failures.push('Missing lib/saas-factory/options-runtime.ts')
} else {
  const source = fs.readFileSync(target, 'utf8')
  for (const token of [
    'runOptionsAction',
    'getOptionsSummary',
    'handleOptionsWorkflowAction',
    'publishOptionsRegistry',
    'rollbackOptionsRegistry',
    'runOptionsValidation',
    '__runOptionsActionCompat',
  ]) {
    if (!source.includes(token)) failures.push(`options-runtime.ts missing ${token}`)
  }
}

for (const route of [
  'app/api/saas-factory/option-groups/route.ts',
  'app/api/saas-factory/options/route.ts',
  'app/api/saas-factory/options/publish/route.ts',
  'app/api/saas-factory/options/rollback/route.ts',
  'app/api/saas-factory/options/validate/route.ts',
]) {
  const full = path.join(root, route)
  if (!fs.existsSync(full)) failures.push(`Missing ${route}`)
}

if (failures.length) {
  console.error('Options runtime export verification failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('Options runtime export verification passed.')
