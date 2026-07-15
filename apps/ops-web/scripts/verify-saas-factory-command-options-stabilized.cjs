const fs = require('fs')
const path = require('path')

const root = process.cwd()
const runtimePath = path.join(root, 'lib', 'saas-factory', 'options-runtime.ts')
const componentPath = path.join(root, 'components', 'saas-factory', 'options', 'SaasFactoryOptionsCommandCenter.tsx')
const apiRoot = path.join(root, 'app', 'api', 'saas-factory', 'options')
const failures = []

function walk(dir) {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    return entry.isDirectory() ? walk(full) : [full]
  })
}

if (!fs.existsSync(runtimePath)) failures.push(`Missing ${path.relative(root, runtimePath)}`)
if (!fs.existsSync(componentPath)) failures.push(`Missing ${path.relative(root, componentPath)}`)

if (fs.existsSync(runtimePath)) {
  const runtime = fs.readFileSync(runtimePath, 'utf8')
  for (const token of ['getOptionsSummary', 'getOptionsExport', 'sourceConfidence', 'readinessScore', 'counts']) {
    if (!runtime.includes(token)) failures.push(`Runtime missing ${token}`)
  }
}

if (fs.existsSync(componentPath)) {
  const component = fs.readFileSync(componentPath, 'utf8')
  for (const token of [
    'summary.sourceConfidence.toUpperCase()',
    'summary.metrics.readinessScore',
    'summary.metrics.optionGroups',
    'summary.metrics.liveOptions',
    'summary.metrics.featureGates',
    'summary.metrics.warnings',
  ]) {
    if (component.includes(token)) failures.push(`Unsafe component token still present: ${token}`)
  }
}

for (const file of walk(apiRoot).filter((file) => file.endsWith('.ts') || file.endsWith('.tsx'))) {
  const source = fs.readFileSync(file, 'utf8')
  if (source.includes("@/lib/saas-factory/options-runtime")) {
    failures.push(`Stale runtime alias import in ${path.relative(root, file)}`)
  }
}

if (failures.length) {
  console.error('Options stabilization verification failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('Options stabilization verification passed.')
