import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const root = process.cwd()
let passed = 0
let failed = 0
const text = (value) => typeof value === 'string' ? value : Buffer.isBuffer(value) ? value.toString('utf8') : value == null ? '' : String(value)
const check = (name, value, detail = '') => {
  console.log(`${value ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`)
  value ? passed++ : failed++
}
const run = (command, args) => spawnSync(command, args, { cwd: root, encoding: 'utf8', env: { ...process.env, FORCE_COLOR: '0' } })

const review = run(process.execPath, [path.join(root, 'scripts/homeservice-design/review-direct-factory-rescue.mjs')])
process.stdout.write(text(review.stdout)); process.stderr.write(text(review.stderr))
check('direct-factory architecture review passes', review.status === 0)

const local = path.join(root, 'node_modules/.bin/tsc')
const compiler = fs.existsSync(local) ? local : 'tsc'
const config = fs.existsSync(local) ? 'tsconfig.homeservice-direct-factory-rescue.json' : 'tsconfig.homeservice-direct-factory-rescue.shim.json'
const tsc = run(compiler, ['-p', config, '--pretty', 'false'])
const diagnostic = `${text(tsc.stdout)}${text(tsc.stderr)}`.trim()
check('strict isolated TypeScript passes', tsc.status === 0, tsc.status === 0 ? '0 errors' : diagnostic.slice(-4000))

const files = [
  'types/homeservice-factory.ts',
  ...walk(path.join(root, 'lib/homeservice-factory')).filter((file) => /\.ts$/.test(file)).map(relative),
  ...walk(path.join(root, 'components/carelink/service-design/factory')).filter((file) => /\.tsx$/.test(file)).map(relative),
  ...walk(path.join(root, 'app/api/carelink-ops/service-design/factory')).filter((file) => /\.ts$/.test(file)).map(relative),
]
let linkCount = 0
const missing = []
for (const file of files) {
  const source = fs.readFileSync(path.join(root, file), 'utf8')
  for (const match of source.matchAll(/from\s+['"](@\/[^'"]+|\.\.?\/[^'"]+)['"]/g)) {
    linkCount++
    const target = resolveImport(file, match[1])
    if (!target) missing.push(`${file} -> ${match[1]}`)
  }
}
check('local import resolution passes', missing.length === 0, missing.length ? missing.slice(0, 20).join('; ') : `${linkCount} links resolved`)

console.log(`\n${passed}/${passed + failed} HomeService Direct Factory Rescue acceptance checks passed.`)
if (failed) process.exit(1)

function walk(directory) {
  if (!fs.existsSync(directory)) return []
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? walk(path.join(directory, entry.name)) : [path.join(directory, entry.name)])
}
function relative(file) { return path.relative(root, file).replaceAll('\\', '/') }
function resolveImport(owner, specifier) {
  const base = specifier.startsWith('@/') ? path.join(root, specifier.slice(2)) : path.resolve(path.dirname(path.join(root, owner)), specifier)
  return [base, `${base}.ts`, `${base}.tsx`, `${base}.d.ts`, path.join(base, 'index.ts'), path.join(base, 'index.tsx')].find(fs.existsSync) || null
}
