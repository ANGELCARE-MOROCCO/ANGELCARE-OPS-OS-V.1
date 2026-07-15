const fs = require('fs')
const path = require('path')

const root = process.cwd()
const runtimeFile = path.join(root, 'lib', 'saas-factory', 'options-runtime.ts')
const summaryRoute = path.join(root, 'app', 'api', 'saas-factory', 'options', 'summary', 'route.ts')

const failures = []

if (!fs.existsSync(runtimeFile)) failures.push(`Missing ${path.relative(root, runtimeFile)}`)
if (!fs.existsSync(summaryRoute)) failures.push(`Missing ${path.relative(root, summaryRoute)}`)

function walk(dir) {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    return entry.isDirectory() ? walk(full) : [full]
  })
}

const apiRoot = path.join(root, 'app', 'api', 'saas-factory', 'options')
for (const file of walk(apiRoot).filter((f) => f.endsWith('.ts') || f.endsWith('.tsx'))) {
  const source = fs.readFileSync(file, 'utf8')
  if (source.includes("@/lib/saas-factory/options-runtime")) {
    failures.push(`Stale alias import remains in ${path.relative(root, file)}`)
  }
}

if (fs.existsSync(runtimeFile)) {
  const runtime = fs.readFileSync(runtimeFile, 'utf8')
  for (const token of ['getOptionsSummary', 'getOptionsExport', 'fallback']) {
    if (!runtime.includes(token)) failures.push(`Runtime file missing token: ${token}`)
  }
}

if (failures.length) {
  console.error('Options runtime import fix verification failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('Options runtime import fix verification passed.')
