import fs from 'node:fs'
import { spawnSync } from 'node:child_process'

function loadDotEnv(file = '.env.local') {
  if (!fs.existsSync(file)) return
  const text = fs.readFileSync(file, 'utf8')
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#') || !line.includes('=')) continue
    const [key, ...rest] = line.split('=')
    if (!process.env[key]) process.env[key] = rest.join('=').replace(/^['"]|['"]$/g, '')
  }
}

loadDotEnv()

const requiredScripts = [
  ['Partner lifecycle smoke', 'scripts/smoke-traininghub-partner-lifecycle.mjs'],
  ['Delivery certification smoke', 'scripts/smoke-traininghub-delivery-certification.mjs'],
  ['Production sync verifier', 'scripts/verify-traininghub-production-sync.mjs'],
  ['Partner isolation verifier', 'scripts/verify-traininghub-partner-isolation.mjs'],
  ['Release cutover gate', 'scripts/verify-traininghub-release-cutover-gate.mjs'],
]

const optionalScripts = [
  ['Final production gate legacy', 'scripts/verify-traininghub-final-production-gate.mjs'],
  ['Cutover report', 'scripts/traininghub-production-cutover-report.mjs'],
]

function run(label, file, args = []) {
  const startedAt = new Date().toISOString()
  const child = spawnSync(process.execPath, [file, ...args], {
    stdio: 'pipe',
    encoding: 'utf8',
    env: process.env,
  })

  const result = {
    checkpoint: label,
    script: file,
    pass: child.status === 0,
    status: child.status,
    startedAt,
    stdout: child.stdout?.slice(-5000) || '',
    stderr: child.stderr?.slice(-5000) || '',
  }

  if (result.stdout) console.log(`\n--- ${label} stdout ---\n${result.stdout}`)
  if (result.stderr) console.error(`\n--- ${label} stderr ---\n${result.stderr}`)

  return result
}

const missingRequired = requiredScripts.filter(([, file]) => !fs.existsSync(file))
if (missingRequired.length) {
  console.error('Missing required TrainingHub journey scripts:')
  console.table(missingRequired.map(([label, file]) => ({ label, file })))
  process.exit(1)
}

const results = []

for (const [label, file] of requiredScripts) {
  results.push(run(label, file))
  if (!results.at(-1).pass) break
}

for (const [label, file] of optionalScripts) {
  if (fs.existsSync(file)) results.push(run(label, file))
}

console.log('\nTrainingHub E2E journey smoke summary')
console.table(results.map((row) => ({
  checkpoint: row.checkpoint,
  pass: row.pass,
  status: row.status,
})))

fs.mkdirSync('tmp', { recursive: true })
fs.writeFileSync('tmp/traininghub-e2e-prod-journey-smoke-report.json', JSON.stringify({
  generatedAt: new Date().toISOString(),
  results,
  note: 'This script orchestrates the existing TrainingHub smoke chain. It intentionally leaves smoke data unless the cleanup script is run separately.',
}, null, 2))

if (results.some((row) => !row.pass)) {
  console.error('\nTrainingHub E2E journey smoke FAILED.')
  console.error('Report: tmp/traininghub-e2e-prod-journey-smoke-report.json')
  process.exit(1)
}

console.log('\nTrainingHub E2E journey smoke PASSED.')
console.log('Report: tmp/traininghub-e2e-prod-journey-smoke-report.json')
