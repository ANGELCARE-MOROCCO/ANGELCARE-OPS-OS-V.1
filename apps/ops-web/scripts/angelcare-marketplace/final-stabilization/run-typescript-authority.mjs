import fs from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { projectRoot, writeEvidence, markdownTable } from './lib.mjs'

const root = projectRoot()
const startedAt = new Date().toISOString()
const maxMinutes = Number(process.env.MARKETPLACE_TYPESCRIPT_MAX_MINUTES || 20)
const heapMb = Number(process.env.MARKETPLACE_TYPESCRIPT_HEAP_MB || 3072)
const includeGenerated = process.argv.includes('--include-generated')
const targeted = process.argv.includes('--targeted')
const script = path.join(root, 'scripts/angelcare-marketplace/verify-typescript-deployment-batches.mjs')
const compiler = path.join(root, 'node_modules/typescript/bin/tsc')
const packagePath = path.join(root, 'node_modules/typescript/package.json')

for (const required of [script, compiler, packagePath]) {
  if (!fs.existsSync(required)) {
    console.error(`FAIL: Required TypeScript authority is unavailable: ${required}`)
    process.exit(1)
  }
}

const version = JSON.parse(fs.readFileSync(packagePath, 'utf8')).version
const deadline = Date.now() + maxMinutes * 60_000
const runs = []

function remainingMs() {
  return Math.max(1, deadline - Date.now())
}

function run(label, command, args, timeoutMs) {
  return new Promise((resolve) => {
    const started = Date.now()
    const child = spawn(command, args, {
      cwd: root,
      env: {
        ...process.env,
        NODE_OPTIONS: `--max-old-space-size=${heapMb}`,
        TERM: 'dumb',
      },
    })
    let output = ''
    const timer = setTimeout(() => {
      child.kill('SIGTERM')
      setTimeout(() => child.kill('SIGKILL'), 3_000).unref()
    }, Math.min(timeoutMs, remainingMs()))
    child.stdout.on('data', (chunk) => {
      const text = chunk.toString()
      output += text
      process.stdout.write(text)
    })
    child.stderr.on('data', (chunk) => {
      const text = chunk.toString()
      output += text
      process.stderr.write(text)
    })
    child.on('close', (code, signal) => {
      clearTimeout(timer)
      const record = {
        label,
        status: code === 0 ? 'PASS' : 'FAIL',
        exitCode: code,
        signal,
        durationSeconds: Number(((Date.now() - started) / 1000).toFixed(1)),
        output: output.slice(-100_000),
      }
      runs.push(record)
      resolve(record)
    })
  })
}

console.log('ANGELCARE Marketplace — 8 GB TypeScript Batch Authority')
console.log(`Node: ${process.version}`)
console.log(`TypeScript: ${version}`)
console.log(`Heap per process: ${heapMb} MB`)
console.log(`Total time budget: ${maxMinutes} minutes`)
console.log(`Generated Next types: ${includeGenerated ? 'included' : 'excluded'}`)

const batchArgs = [script]
if (!includeGenerated) batchArgs.push('--source-only')
const batchRun = await run('Marketplace reachable-source batch authority', process.execPath, batchArgs, remainingMs())
let passed = batchRun.status === 'PASS'

if (passed && targeted) {
  const configs = fs.readdirSync(root)
    .filter((name) => /^tsconfig\.angelcare-marketplace-.+\.json$/.test(name))
    .sort()
  for (const config of configs) {
    if (remainingMs() < 5_000) {
      runs.push({ label: config, status: 'NOT_RUN', exitCode: null, signal: null, durationSeconds: 0, output: 'Overall time budget exhausted.' })
      passed = false
      break
    }
    console.log(`\n=== TARGETED CONFIG ${config} ===`)
    const result = await run(
      config,
      process.execPath,
      [`--max-old-space-size=${heapMb}`, compiler, '-p', config, '--noEmit', '--pretty', 'false'],
      Math.min(180_000, remainingMs()),
    )
    if (result.status !== 'PASS') {
      passed = false
      break
    }
  }
}

const completedAt = new Date().toISOString()
const evidence = {
  programme: 'ANGELCARE Marketplace TypeScript Batch Authority',
  startedAt,
  completedAt,
  status: passed ? 'PASS' : 'FAIL',
  node: process.version,
  typescript: version,
  heapMb,
  maxMinutes,
  includeGenerated,
  targeted,
  runs,
}
const markdown = `# ANGELCARE Marketplace TypeScript Batch Authority

**Status:** ${evidence.status}
**Node:** ${process.version}
**TypeScript:** ${version}
**Heap cap:** ${heapMb} MB per process
**Execution budget:** ${maxMinutes} minutes

${markdownTable(['Gate', 'Status', 'Duration', 'Exit'], runs.map((entry) => [entry.label, entry.status, `${entry.durationSeconds}s`, entry.exitCode ?? entry.signal ?? '—']))}

This gate performs no build, Git operation, SQL execution, deployment, package installation, or TypeScript suppression.
`
const paths = writeEvidence('TYPESCRIPT_AUTHORITY', evidence, markdown)
console.log(`\nRESULT: ${evidence.status}`)
console.log(`Evidence: ${paths.latestMarkdown}`)
process.exitCode = passed ? 0 : 1
