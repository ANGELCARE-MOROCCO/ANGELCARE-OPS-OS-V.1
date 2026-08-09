const fs = require('fs')
const path = require('path')

const root = process.cwd()
const runtimePath = path.join(root, 'lib', 'saas-factory', 'options-runtime.ts')
const apiRoot = path.join(root, 'app', 'api', 'saas-factory', 'options')
const componentPath = path.join(root, 'components', 'saas-factory', 'options', 'SaasFactoryOptionsCommandCenter.tsx')

const failures = []
if (!fs.existsSync(runtimePath)) failures.push(`Missing runtime file after unzip: ${path.relative(root, runtimePath)}`)
if (!fs.existsSync(componentPath)) failures.push(`Missing component: ${path.relative(root, componentPath)}`)
if (failures.length) {
  console.error(failures.join('\n'))
  process.exit(1)
}

function walk(dir) {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    return entry.isDirectory() ? walk(full) : [full]
  })
}

// 1) Rewrite API imports away from unstable alias if present.
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
    console.log(`Rewrote API runtime import: ${path.relative(root, file)} -> ${importPath}`)
  }
}

// 2) Harden the Options component against missing API fields.
let source = fs.readFileSync(componentPath, 'utf8')
const beforeComponent = source

// Exact known crashers.
source = source.replaceAll(
  'summary.sourceConfidence.toUpperCase()',
  "String(summary?.sourceConfidence ?? summary?.source ?? summary?.source_confidence ?? summary?.dataSource ?? 'fallback').toUpperCase()",
)
source = source.replaceAll(
  'summary?.sourceConfidence.toUpperCase()',
  "String(summary?.sourceConfidence ?? summary?.source ?? summary?.source_confidence ?? summary?.dataSource ?? 'fallback').toUpperCase()",
)

source = source.replaceAll(
  'summary.metrics.readinessScore',
  "(summary?.metrics?.readinessScore ?? summary?.counts?.readiness ?? 0)",
)
source = source.replaceAll(
  'summary?.metrics.readinessScore',
  "(summary?.metrics?.readinessScore ?? summary?.counts?.readiness ?? 0)",
)
source = source.replaceAll(
  'summary.metrics.optionGroups',
  "(summary?.metrics?.optionGroups ?? summary?.counts?.optionGroups ?? summary?.groups?.length ?? 0)",
)
source = source.replaceAll(
  'summary.metrics.liveOptions',
  "(summary?.metrics?.liveOptions ?? summary?.counts?.liveOptions ?? summary?.options?.filter?.((option) => option?.status === 'enabled')?.length ?? 0)",
)
source = source.replaceAll(
  'summary.metrics.featureGates',
  "(summary?.metrics?.featureGates ?? summary?.counts?.featureGates ?? 0)",
)
source = source.replaceAll(
  'summary.metrics.warnings',
  "(summary?.metrics?.warnings ?? summary?.counts?.warnings ?? summary?.warnings?.length ?? 0)",
)

// Common array crashers on fallback/empty payloads.
source = source.replaceAll('summary.options.map(', '(summary?.options ?? []).map(')
source = source.replaceAll('summary.options.filter(', '(summary?.options ?? []).filter(')
source = source.replaceAll('summary.groups.map(', '(summary?.groups ?? []).map(')
source = source.replaceAll('summary.groups.filter(', '(summary?.groups ?? []).filter(')
source = source.replaceAll('summary.warnings.map(', '(summary?.warnings ?? []).map(')
source = source.replaceAll('summary.recommendations.map(', '(summary?.recommendations ?? []).map(')
source = source.replaceAll('summary.audit.map(', '(summary?.audit ?? []).map(')
source = source.replaceAll('summary.disabledActions.map(', '(summary?.disabledActions ?? []).map(')

// General direct uppercase on status/severity/tone fields that may be undefined.
source = source.replace(/([A-Za-z0-9_?.\]\)]+)\.toUpperCase\(\)/g, (match, expr) => {
  if (match.includes('String(')) return match
  if (expr.includes('sourceConfidence') || expr.includes('.status') || expr.includes('.severity') || expr.includes('.source')) {
    return `String(${expr} ?? 'unknown').toUpperCase()`
  }
  return match
})

if (source !== beforeComponent) {
  fs.writeFileSync(componentPath, source)
  console.log(`Hardened component: ${path.relative(root, componentPath)}`)
} else {
  console.log('Component did not need known fallback replacements.')
}

// 3) Verify critical unsafe strings are gone.
const repaired = fs.readFileSync(componentPath, 'utf8')
const stillBad = [
  'summary.sourceConfidence.toUpperCase()',
  'summary.metrics.readinessScore',
  'summary.metrics.optionGroups',
  'summary.metrics.liveOptions',
  'summary.metrics.featureGates',
  'summary.metrics.warnings',
].filter((token) => repaired.includes(token))

const staleApiImports = walk(apiRoot)
  .filter((file) => file.endsWith('.ts') || file.endsWith('.tsx'))
  .filter((file) => fs.readFileSync(file, 'utf8').includes("@/lib/saas-factory/options-runtime"))

if (stillBad.length || staleApiImports.length) {
  console.error('Options stabilization still found unsafe/stale patterns:')
  for (const token of stillBad) console.error(`- Unsafe component token: ${token}`)
  for (const file of staleApiImports) console.error(`- Stale API import: ${path.relative(root, file)}`)
  process.exit(1)
}

console.log(`Options stabilization complete. API files changed: ${apiChanged}`)
console.log('Next: rm -rf .next && npm run dev')
