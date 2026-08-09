import fs from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'

const root = process.cwd()
const scriptPath = path.resolve(root, 'scripts/angelcare-marketplace/verify-typescript-deployment-batches.mjs')
const includeGenerated = !process.argv.includes('--source-only')
const logName = includeGenerated
  ? 'verify-typescript-deployment-batches.log'
  : 'verify-typescript-deployment-batches-source-only.log'
const logPath = path.resolve(root, 'scripts/angelcare-marketplace', logName)
const startedAt = new Date().toISOString()
const maxBatchSize = 20
const timeoutMs = 180_000
const passDeadlineMs = 20 * 60 * 1000
const academyOnly = process.argv.includes('--academy-only')
const foundationOnly = process.argv.includes('--foundation-only')
const tsconfigExcluded = new Set([
  'node_modules', '.next', '.git', '.agents', '.codex', 'deployment', 'modules', 'backups', '_archive',
  'recovery', 'scripts/flashcards-os/static-type-shims.d.ts',
  'scripts/homeservice-design',
])

function ignored(relative) {
  const segments = relative.split('/')
  return segments.some((segment) => segment === 'node_modules' || segment === '.git' || segment === '.next' || segment === '.agents' || segment === '.codex' || segment === 'deployment' || segment === 'modules' || segment === 'recovery' || segment === 'backups' || segment === '_archive' || segment === '.angelcare_backups' || segment.includes('backups'))
    || relative === 'scripts/flashcards-os/static-type-shims.d.ts'
    || relative.startsWith('scripts/homeservice-design/')
}

function walk(directory, allowNext = false) {
  const result = []
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name)
    const relative = path.relative(root, absolute).replaceAll(path.sep, '/')
    if (ignored(relative) && !(allowNext && (relative === '.next/types' || relative.startsWith('.next/types/')))) continue
    if (entry.isDirectory()) result.push(...walk(absolute, allowNext))
    else result.push(relative)
  }
  return result
}

function isExcluded(file) {
  return Array.from(tsconfigExcluded).some((item) => file === item || file.startsWith(`${item}/`))
}

const allFiles = walk(root).filter((file) => !isExcluded(file))
const generatedTypesRoot = path.join(root, '.next', 'types')
if (fs.existsSync(generatedTypesRoot)) {
  allFiles.push(...walk(generatedTypesRoot, true))
}
const ambient = allFiles.filter((file) => file.endsWith('.d.ts'))
const generated = includeGenerated ? allFiles.filter((file) => file.startsWith('.next/types/') && file.endsWith('.ts')) : []
const sources = allFiles.filter((file) => /\.(ts|tsx)$/.test(file) && !file.endsWith('.d.ts'))
const academy = sources.filter((file) => file.startsWith('angelcare-marketplace/academy-engine/'))
const marketplace = sources.filter((file) => file.startsWith('angelcare-marketplace/'))
const marketplaceRoutes = sources.filter((file) => file.startsWith('app/angelcare-marketplace/') || file.startsWith('app/api/angelcare-marketplace/'))
const sourceSet = new Set(sources)
function resolveSource(from, specifier) {
  if (!specifier.startsWith('.') && !specifier.startsWith('@/')) return null
  const base = specifier.startsWith('@/')
    ? path.join(root, specifier.slice(2))
    : path.resolve(root, path.dirname(from), specifier)
  for (const candidate of [base, `${base}.ts`, `${base}.tsx`, `${base}.d.ts`, path.join(base, 'index.ts'), path.join(base, 'index.tsx')]) {
    const relative = path.relative(root, candidate).replaceAll(path.sep, '/')
    if (sourceSet.has(relative)) return relative
  }
  return null
}
function reachableFrom(seeds) {
  const found = new Set(seeds)
  const queue = [...seeds]
  while (queue.length) {
    const file = queue.shift()
    const text = fs.readFileSync(path.join(root, file), 'utf8')
    const imports = text.match(/(?:from|import)\s*[('"`]([^'"`]+)['"`)]/g) || []
    for (const statement of imports) {
      const specifier = statement.match(/[('"`]([^'"`]+)['"`)]/)?.[1]
      const resolved = specifier ? resolveSource(file, specifier) : null
      if (resolved && !found.has(resolved)) { found.add(resolved); queue.push(resolved) }
    }
  }
  return [...found]
}
const reachable = reachableFrom([...marketplace, ...marketplaceRoutes])
const other = reachable.filter((file) => !file.startsWith('angelcare-marketplace/') && !marketplaceRoutes.includes(file))

const priority = [
  'angelcare-marketplace/academy-engine/components/AcademyCommand.tsx',
  'angelcare-marketplace/components/FoundationUnavailable.tsx',
]
let ordered = [...new Set([
  ...priority,
  ...academy,
  ...marketplace,
  ...marketplaceRoutes,
  ...other,
].filter((file) => sources.includes(file)))]
if (academyOnly) ordered = [...new Set([...priority, ...academy].filter((file) => sources.includes(file)))]
if (foundationOnly) ordered = [priority[1]].filter((file) => sources.includes(file))

const log = []
function record(line = '') {
  log.push(line)
  process.stdout.write(`${line}\n`)
}

function runTsc(batch, batchNumber) {
  return new Promise((resolve) => {
    const configPath = path.join('/private/tmp', `angelcare-tsc-batch-${process.pid}-${batchNumber}.json`)
    const include = [...new Set(['next-env.d.ts', ...ambient, ...generated, ...batch])].map((file) => path.resolve(root, file))
    fs.writeFileSync(configPath, JSON.stringify({
      compilerOptions: {
        target: 'ES2017', lib: ['dom', 'dom.iterable', 'esnext'], allowJs: true,
        skipLibCheck: false, strict: true, noEmit: true, incremental: false,
        esModuleInterop: true, module: 'esnext', moduleResolution: 'bundler',
        resolveJsonModule: true, isolatedModules: true, jsx: 'react-jsx',
        baseUrl: root, paths: { '@/*': ['./*'] }, plugins: [{ name: 'next' }],
      },
      include,
      exclude: ['node_modules', 'deployment', 'modules', 'backups', '_archive', 'recovery',
        '.angelcare_backups', '.angelcare-marketplace-backups', '.flashcards-os-backups',
        'scripts/flashcards-os/static-type-shims.d.ts', 'scripts/homeservice-design/**'],
    }, null, 2), 'utf8')
    const child = spawn(process.execPath, ['--max-old-space-size=3072', 'node_modules/typescript/bin/tsc', '-p', configPath, '--pretty', 'false'], { cwd: root })
    let output = ''
    let timedOut = false
    const timer = setTimeout(() => {
      timedOut = true
      child.kill('SIGTERM')
    }, timeoutMs)
    child.stdout.on('data', (chunk) => { output += chunk })
    child.stderr.on('data', (chunk) => { output += chunk })
    child.on('close', (code, signal) => {
      clearTimeout(timer)
      fs.rmSync(configPath, { force: true })
      resolve({ code, signal, timedOut, output })
    })
  })
}

function splitBatch(batch) {
  const midpoint = Math.ceil(batch.length / 2)
  return [batch.slice(0, midpoint), batch.slice(midpoint)]
}

async function verify(batch, label, state) {
  if (!batch.length) return true
  if (Date.now() - state.started > passDeadlineMs) {
    record(`PASS_DEADLINE_EXCEEDED label=${label}`)
    return false
  }
  const batchNumber = ++state.batchCount
  record(`BATCH ${batchNumber} label=${label} entries=${batch.length} ambient=${ambient.length} generated=${generated.length}`)
  record(`FILES ${batch.join(' | ')}`)
  const result = await runTsc(batch, batchNumber)
  if (result.timedOut || result.signal === 'SIGKILL' || /JavaScript heap out of memory|heap limit/i.test(result.output)) {
    if (batch.length === 1) {
      record(`FAIL_UNDIVIDABLE label=${label} timeout_or_memory=true`)
      record(result.output.trim())
      return false
    }
    record(`DIVIDE label=${label} reason=${result.timedOut ? 'timeout' : 'memory'}`)
    const [left, right] = splitBatch(batch)
    return (await verify(left, `${label}.a`, state)) && (await verify(right, `${label}.b`, state))
  }
  if (result.code !== 0) {
    record(`FAIL label=${label} exit=${result.code}`)
    record(result.output.trim())
    return false
  }
  record(`PASS label=${label}`)
  return true
}

fs.writeFileSync(logPath, '', 'utf8')
record(`START ${startedAt}`)
record(`NODE ${process.version}`)
record(`TYPESCRIPT ${JSON.parse(fs.readFileSync(path.join(root, 'node_modules/typescript/package.json'), 'utf8')).version}`)
record(`AMBIENT_COUNT ${ambient.length}`)
record(`SOURCE_COUNT ${ordered.length}`)
record(`SCRIPT ${scriptPath}`)

const state = { started: Date.now(), batchCount: 0 }
let passed = true
for (let index = 0; index < ordered.length && passed; index += maxBatchSize) {
  const batch = ordered.slice(index, index + maxBatchSize)
  passed = await verify(batch, `deployment-${Math.floor(index / maxBatchSize) + 1}`, state)
}
record(`SUMMARY status=${passed ? 'PASS' : 'FAIL'} batches=${state.batchCount} files=${ordered.length} ambient=${ambient.length}`)
fs.writeFileSync(logPath, `${log.join('\n')}\n`, 'utf8')
process.exitCode = passed ? 0 : 1
