import fs from 'node:fs'
import { spawnSync } from 'node:child_process'
import { createClient } from '@supabase/supabase-js'

function loadDotEnv(file = '.env.local') {
  if (!fs.existsSync(file)) return
  const text = fs.readFileSync(file, 'utf8')
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#') || !line.includes('=')) continue
    const [key, ...rest] = line.split('=')
    if (!process.env[key]) {
      process.env[key] = rest.join('=').replace(/^['"]|['"]$/g, '')
    }
  }
}

loadDotEnv()

const args = new Set(process.argv.slice(2))
const withTsc = args.has('--with-tsc') || args.has('--full')
const withBuild = args.has('--with-build') || args.has('--full')
const withE2E = args.has('--with-e2e') || args.has('--full')

const requiredTables = [
  'core_organizations',
  'core_user_profiles',
  'core_memberships',
  'authz_user_role_assignments',
  'bill_accounts',
  'bill_proposals',
  'bill_orders',
  'bill_invoices',
  'bill_training_credits',
  'trn_sessions',
  'trn_session_participants',
  'trn_certificates',
]

function runCommand(label, command, commandArgs, options = {}) {
  const startedAt = new Date().toISOString()
  const result = spawnSync(command, commandArgs, {
    stdio: 'pipe',
    encoding: 'utf8',
    env: {
      ...process.env,
      NODE_OPTIONS: process.env.NODE_OPTIONS || '--max-old-space-size=8192',
    },
    ...options,
  })

  return {
    checkpoint: label,
    pass: result.status === 0,
    status: result.status,
    command: [command, ...commandArgs].join(' '),
    startedAt,
    stdout: result.stdout?.slice(-5000) || '',
    stderr: result.stderr?.slice(-5000) || '',
  }
}

async function checkSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY

  const envRows = [
    { checkpoint: 'NEXT_PUBLIC_SUPABASE_URL', pass: Boolean(url) },
    { checkpoint: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', pass: Boolean(anon) },
    { checkpoint: 'SUPABASE_SERVICE_ROLE_KEY', pass: Boolean(service) },
  ]

  if (!url || !service) {
    return {
      envRows,
      tableRows: requiredTables.map((table) => ({ table, reachable: false, count: null, error: 'Missing Supabase service environment' })),
    }
  }

  const supabase = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } })
  const tableRows = []

  for (const table of requiredTables) {
    const { count, error } = await supabase.from(table).select('id', { head: true, count: 'exact' })
    tableRows.push({
      table,
      reachable: !error,
      count: typeof count === 'number' ? count : null,
      error: error?.message || '',
    })
  }

  return { envRows, tableRows }
}

function printCommandResult(result) {
  if (!result.pass) {
    console.error(`\n❌ ${result.checkpoint} failed`)
    if (result.stdout) console.error(result.stdout)
    if (result.stderr) console.error(result.stderr)
  }
}

async function main() {
  const results = []

  const staticResult = runCommand('Static hardening verifier', [process.execPath][0], ['scripts/verify-traininghub-production-hardening-static.mjs'])
  results.push(staticResult)
  printCommandResult(staticResult)

  const accessVerifier = 'scripts/verify-traininghub-existing-partner-access-password-complete.mjs'
  if (fs.existsSync(accessVerifier)) {
    const accessResult = runCommand('Existing partner access/password verifier', process.execPath, [accessVerifier])
    results.push(accessResult)
    printCommandResult(accessResult)
  } else {
    results.push({
      checkpoint: 'Existing partner access/password verifier',
      pass: false,
      status: 1,
      command: accessVerifier,
      stdout: '',
      stderr: 'Verifier missing.',
    })
  }

  const { envRows, tableRows } = await checkSupabase()

  console.log('\nEnvironment')
  console.table(envRows)
  console.log('\nSchema reachability')
  console.table(tableRows)

  const envPass = envRows.every((row) => row.pass)
  const schemaPass = tableRows.every((row) => row.reachable)
  results.push({ checkpoint: 'Supabase environment', pass: envPass })
  results.push({ checkpoint: 'Schema reachability', pass: schemaPass })

  if (withTsc) {
    const tsc = runCommand('TypeScript noEmit', 'npx', ['tsc', '--noEmit', '--pretty', 'false'])
    results.push(tsc)
    printCommandResult(tsc)
  }

  if (withBuild) {
    const build = runCommand('Next production build', 'npm', ['run', 'build'])
    results.push(build)
    printCommandResult(build)
  }

  if (withE2E) {
    const e2e = runCommand('TrainingHub E2E journey smoke', process.execPath, ['scripts/traininghub-e2e-prod-journey-smoke.mjs'])
    results.push(e2e)
    printCommandResult(e2e)
  }

  const required = results.map((row) => ({
    checkpoint: row.checkpoint,
    pass: Boolean(row.pass),
    status: row.status ?? '',
  }))

  console.log('\nTrainingHub final production completion gate summary')
  console.table(required)

  const score = Math.round((required.filter((row) => row.pass).length / required.length) * 100)

  const report = {
    generatedAt: new Date().toISOString(),
    mode: { withTsc, withBuild, withE2E },
    score,
    envRows,
    tableRows,
    results: required,
  }

  fs.mkdirSync('tmp', { recursive: true })
  fs.writeFileSync('tmp/traininghub-final-production-completion-gate-report.json', JSON.stringify(report, null, 2))

  if (required.some((row) => !row.pass)) {
    console.error(`\nTrainingHub FINAL PRODUCTION COMPLETION GATE FAILED. Score: ${score}/100`)
    console.error('Report: tmp/traininghub-final-production-completion-gate-report.json')
    process.exit(1)
  }

  console.log(`\nTrainingHub FINAL PRODUCTION COMPLETION GATE PASSED. Score: ${score}/100`)
  console.log('Report: tmp/traininghub-final-production-completion-gate-report.json')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
