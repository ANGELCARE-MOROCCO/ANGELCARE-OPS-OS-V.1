const fs = require('fs')
const path = require('path')

const root = process.cwd()
const apiRoot = path.join(root, 'app', 'api', 'saas-factory', 'options')
const runtimeFile = path.join(root, 'lib', 'saas-factory', 'options-runtime.ts')

if (!fs.existsSync(runtimeFile)) {
  console.error(`Missing runtime file: ${runtimeFile}`)
  process.exit(1)
}

function walk(dir) {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    return entry.isDirectory() ? walk(full) : [full]
  })
}

const routeFiles = walk(apiRoot).filter((file) => file.endsWith('.ts') || file.endsWith('.tsx'))
let changed = 0

for (const file of routeFiles) {
  let source = fs.readFileSync(file, 'utf8')
  const before = source
  const rel = path.relative(path.dirname(file), runtimeFile).replaceAll(path.sep, '/').replace(/\.ts$/, '')
  const normalized = rel.startsWith('.') ? rel : `./${rel}`

  source = source.replaceAll("@/lib/saas-factory/options-runtime", normalized)
  source = source.replaceAll('~/lib/saas-factory/options-runtime', normalized)

  if (source !== before) {
    fs.writeFileSync(file, source)
    changed += 1
    console.log(`Rewrote runtime import in ${path.relative(root, file)} -> ${normalized}`)
  }
}

console.log(`Options runtime import fix complete. Files changed: ${changed}`)
