import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const root = process.cwd()
let passed = 0
let failed = 0
const text = (value) => typeof value === 'string' ? value : Buffer.isBuffer(value) ? value.toString('utf8') : value == null ? '' : String(value)
const check = (name, value, detail = '') => {
  const ok = Boolean(value)
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`)
  ok ? passed++ : failed++
}
const run = (command, args) => spawnSync(command, args, { cwd: root, encoding: 'utf8', env: { ...process.env, FORCE_COLOR: '0' } })

const baselineFiles = [
  'supabase/migrations/20260802_homeservice_direct_factory_rescue.sql',
  'lib/homeservice-factory/server/catalogue.ts',
  'lib/homeservice-factory/server/composer.ts',
  'lib/homeservice-factory/server/repository.ts',
  'scripts/homeservice-design/verify-direct-factory-rescue.mjs',
]
check('Catalogue-to-Mission Rescue baseline remains present', baselineFiles.every((file) => fs.existsSync(path.join(root, file))), `${baselineFiles.filter((file) => fs.existsSync(path.join(root, file))).length}/${baselineFiles.length} baseline files`)

const review = run(process.execPath, [path.join(root, 'scripts/homeservice-design/review-category-master-experience.mjs')])
process.stdout.write(text(review.stdout)); process.stderr.write(text(review.stderr))
check('Category Master Experience architecture review passes', review.status === 0)

const local = path.join(root, 'node_modules/.bin/tsc')
let compiler = local
let compilerArgs = ['-p', 'tsconfig.homeservice-category-master-experience.json', '--pretty', 'false']
if (!fs.existsSync(local)) {
  const globalProbe = run('tsc', ['--version'])
  if (globalProbe.status === 0) {
    compiler = 'tsc'
    compilerArgs = ['-p', 'tsconfig.homeservice-category-master-experience.shim.json', '--pretty', 'false']
  } else {
    compiler = 'npx'
    compilerArgs = ['--no-install', 'tsc', '-p', 'tsconfig.homeservice-category-master-experience.shim.json', '--pretty', 'false']
  }
}
const tsc = run(compiler, compilerArgs)
const diagnostic = `${text(tsc.stdout)}${text(tsc.stderr)}`.trim()
check('strict isolated TypeScript passes', tsc.status === 0, tsc.status === 0 ? '0 errors' : diagnostic.slice(-5000))

const files = [
  'types/homeservice-category-experience.ts', 'types/homeservice-factory.ts',
  ...walk(path.join(root, 'lib/homeservice-factory')).filter((file) => /\.ts$/.test(file)).map(relative),
  ...walk(path.join(root, 'components/carelink/service-design/factory')).filter((file) => /\.(ts|tsx)$/.test(file)).map(relative),
  ...walk(path.join(root, 'app/carelink-ops/service-design/factory')).filter((file) => /\.(ts|tsx)$/.test(file)).map(relative),
  ...walk(path.join(root, 'app/api/carelink-ops/service-design/factory')).filter((file) => /\.ts$/.test(file)).map(relative),
]
let linkCount = 0
const missing = []
for (const file of files) {
  const source = fs.readFileSync(path.join(root, file), 'utf8')
  for (const match of source.matchAll(/from\s+['"](@\/[^'"]+|\.\.?\/[^'"]+)['"]/g)) {
    linkCount++
    if (!resolveImport(file, match[1])) missing.push(`${file} -> ${match[1]}`)
  }
}
check('local import resolution passes', missing.length === 0, missing.length ? missing.slice(0, 30).join('; ') : `${linkCount} links resolved`)

console.log(`\n${passed}/${passed + failed} Category Master Experience orchestrated checks passed.`)
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
