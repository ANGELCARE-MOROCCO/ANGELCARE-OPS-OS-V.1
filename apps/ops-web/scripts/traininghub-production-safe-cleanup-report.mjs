import fs from 'node:fs'
import { spawnSync } from 'node:child_process'

function run(label, args) {
  const startedAt = new Date().toISOString()
  const child = spawnSync(process.execPath, args, {
    stdio: 'pipe',
    encoding: 'utf8',
    env: process.env,
  })

  return {
    label,
    command: [process.execPath, ...args].join(' '),
    startedAt,
    status: child.status,
    pass: child.status === 0,
    stdout: child.stdout?.slice(-4000) || '',
    stderr: child.stderr?.slice(-4000) || '',
  }
}

const cleanupScript = 'scripts/traininghub-clean-smoke-records.mjs'

if (!fs.existsSync(cleanupScript)) {
  console.error(`Missing ${cleanupScript}. Cannot produce cleanup report.`)
  process.exit(1)
}

const dryRun = run('smoke cleanup dry run', [cleanupScript])
console.log(dryRun.stdout)
if (dryRun.stderr) console.error(dryRun.stderr)

const report = {
  generatedAt: new Date().toISOString(),
  dryRun,
  nextStep: 'To execute cleanup: node --env-file=.env.local scripts/traininghub-clean-smoke-records.mjs --execute --yes',
}

fs.mkdirSync('tmp', { recursive: true })
fs.writeFileSync('tmp/traininghub-production-safe-cleanup-report.json', JSON.stringify(report, null, 2))

if (!dryRun.pass) process.exit(1)

console.log('\nCleanup dry-run report saved: tmp/traininghub-production-safe-cleanup-report.json')
