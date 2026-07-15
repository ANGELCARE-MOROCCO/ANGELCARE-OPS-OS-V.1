const fs = require('fs')
const path = require('path')

const root = process.cwd()
const componentPath = path.join(root, 'components', 'saas-factory', 'options', 'SaasFactoryOptionsCommandCenter.tsx')
const runtimePath = path.join(root, 'lib', 'saas-factory', 'options-runtime.ts')
const apiRoot = path.join(root, 'app', 'api', 'saas-factory', 'options')

if (!fs.existsSync(componentPath)) {
  console.error(`Missing component: ${path.relative(root, componentPath)}`)
  process.exit(1)
}
if (!fs.existsSync(runtimePath)) {
  console.error(`Missing runtime: ${path.relative(root, runtimePath)}`)
  process.exit(1)
}

function walk(dir) {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    return entry.isDirectory() ? walk(full) : [full]
  })
}

// API import repair
let apiChanged = 0
for (const file of walk(apiRoot).filter((file) => file.endsWith('.ts') || file.endsWith('.tsx'))) {
  let source = fs.readFileSync(file, 'utf8')
  const before = source
  const rel = path.relative(path.dirname(file), runtimePath).replaceAll(path.sep, '/').replace(/\.ts$/, '')
  const importPath = rel.startsWith('.') ? rel : `./${rel}`

  source = source.replaceAll("@/lib/saas-factory/options-runtime", importPath)
  source = source.replaceAll('~/lib/saas-factory/options-runtime', importPath)

  if (source !== before) {
    fs.writeFileSync(file, source)
    apiChanged += 1
    console.log(`Rewrote API import ${path.relative(root, file)} -> ${importPath}`)
  }
}

let source = fs.readFileSync(componentPath, 'utf8')
const before = source

const replacements = [
  ['summary.sourceConfidence.toUpperCase()', "String(summary?.sourceConfidence ?? summary?.source ?? summary?.source_confidence ?? summary?.dataSource ?? 'fallback').toUpperCase()"],
  ['summary?.sourceConfidence.toUpperCase()', "String(summary?.sourceConfidence ?? summary?.source ?? summary?.source_confidence ?? summary?.dataSource ?? 'fallback').toUpperCase()"],

  ['summary.metrics.readinessScore', '(summary?.metrics?.readinessScore ?? summary?.counts?.readinessScore ?? summary?.counts?.readiness ?? 0)'],
  ['summary.metrics.optionGroups', '(summary?.metrics?.optionGroups ?? summary?.counts?.optionGroups ?? summary?.groups?.length ?? 0)'],
  ['summary.metrics.liveOptions', "(summary?.metrics?.liveOptions ?? summary?.counts?.liveOptions ?? summary?.options?.filter?.((option) => option?.status === 'enabled')?.length ?? 0)"],
  ['summary.metrics.featureGates', '(summary?.metrics?.featureGates ?? summary?.counts?.featureGates ?? 0)'],
  ['summary.metrics.warnings', '(summary?.metrics?.warnings ?? summary?.counts?.warnings ?? summary?.warnings?.length ?? 0)'],
  ['summary.metrics.modulesImpacted', '(summary?.metrics?.modulesImpacted ?? summary?.counts?.modulesImpacted ?? summary?.modulesImpacted?.length ?? 0)'],
  ['summary.metrics.auditEvents', '(summary?.metrics?.auditEvents ?? summary?.counts?.auditEvents ?? summary?.auditEvents?.length ?? summary?.audit?.length ?? 0)'],

  ['summary.auditEvents.length', '(summary?.auditEvents?.length ?? summary?.audit?.length ?? 0)'],
  ['summary.modulesImpacted.length', '(summary?.modulesImpacted?.length ?? 0)'],
  ['summary.options.length', '(summary?.options?.length ?? 0)'],
  ['summary.groups.length', '(summary?.groups?.length ?? 0)'],
  ['summary.warnings.length', '(summary?.warnings?.length ?? 0)'],
  ['summary.recommendations.length', '(summary?.recommendations?.length ?? 0)'],
  ['summary.disabledActions.length', '(summary?.disabledActions?.length ?? 0)'],

  ['summary.auditEvents.map(', '(summary?.auditEvents ?? summary?.audit ?? []).map('],
  ['summary.modulesImpacted.map(', '(summary?.modulesImpacted ?? []).map('],
  ['summary.options.map(', '(summary?.options ?? []).map('],
  ['summary.groups.map(', '(summary?.groups ?? []).map('],
  ['summary.warnings.map(', '(summary?.warnings ?? []).map('],
  ['summary.recommendations.map(', '(summary?.recommendations ?? []).map('],
  ['summary.disabledActions.map(', '(summary?.disabledActions ?? []).map('],

  ['summary.auditEvents.filter(', '(summary?.auditEvents ?? summary?.audit ?? []).filter('],
  ['summary.modulesImpacted.filter(', '(summary?.modulesImpacted ?? []).filter('],
  ['summary.options.filter(', '(summary?.options ?? []).filter('],
  ['summary.groups.filter(', '(summary?.groups ?? []).filter('],
  ['summary.warnings.filter(', '(summary?.warnings ?? []).filter('],
  ['summary.recommendations.filter(', '(summary?.recommendations ?? []).filter('],
]

for (const [from, to] of replacements) {
  source = source.replaceAll(from, to)
}

// Direct missing-field uppercase guards for common row fields.
source = source.replace(/([A-Za-z0-9_?.\]\)]+)\.toUpperCase\(\)/g, (match, expr) => {
  if (match.includes('String(')) return match
  if (
    expr.includes('sourceConfidence') ||
    expr.endsWith('.status') ||
    expr.endsWith('?.status') ||
    expr.endsWith('.severity') ||
    expr.endsWith('?.severity') ||
    expr.endsWith('.source') ||
    expr.endsWith('?.source')
  ) {
    return `String(${expr} ?? 'unknown').toUpperCase()`
  }
  return match
})

if (source !== before) {
  fs.writeFileSync(componentPath, source)
  console.log(`Hardened ${path.relative(root, componentPath)}`)
} else {
  console.log('No component replacements applied. File may already be patched.')
}

const repaired = fs.readFileSync(componentPath, 'utf8')
const forbidden = [
  'summary.sourceConfidence.toUpperCase()',
  'summary.metrics.readinessScore',
  'summary.metrics.optionGroups',
  'summary.metrics.liveOptions',
  'summary.metrics.featureGates',
  'summary.metrics.warnings',
  'summary.metrics.modulesImpacted',
  'summary.metrics.auditEvents',
  'summary.auditEvents.length',
  'summary.modulesImpacted.length',
]

const failures = forbidden.filter((token) => repaired.includes(token))

const staleImports = walk(apiRoot)
  .filter((file) => file.endsWith('.ts') || file.endsWith('.tsx'))
  .filter((file) => fs.readFileSync(file, 'utf8').includes("@/lib/saas-factory/options-runtime"))

if (failures.length || staleImports.length) {
  console.error('Options total stabilizer failed:')
  for (const failure of failures) console.error(`- Unsafe token remains: ${failure}`)
  for (const file of staleImports) console.error(`- Stale import remains: ${path.relative(root, file)}`)
  process.exit(1)
}

console.log(`Options total stabilizer complete. API imports changed: ${apiChanged}`)
console.log('Next: rm -rf .next && npm run dev')
