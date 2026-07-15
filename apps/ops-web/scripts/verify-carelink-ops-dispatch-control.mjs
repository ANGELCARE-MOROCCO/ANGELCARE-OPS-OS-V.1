import fs from 'fs'

const required = [
  'app/carelink-ops/dispatch/page.tsx',
  'app/api/carelink/ops/dispatch/route.ts',
  'app/api/carelink/ops/dispatch/missions/route.ts',
  'app/api/carelink/ops/dispatch/missions/[id]/route.ts',
  'app/api/carelink/ops/dispatch/actions/route.ts',
  'components/carelink/ops/dispatch/CareLinkDispatchControlCenter.tsx',
  'lib/carelink/ops-dispatch-types.ts',
  'lib/carelink/ops-dispatch-repository.ts',
  'supabase/migrations/20260610_carelink_ops_dispatch_control.sql',
]

const missing = required.filter((file) => !fs.existsSync(file))
if (missing.length) {
  console.error('Missing CareLink Ops dispatch files:')
  for (const file of missing) console.error(' -', file)
  process.exit(1)
}

const forbiddenPatterns = [/M-110/i, /Famille/i, /demo/i, /sample/i, /seed/i]
const scanFiles = required.filter((file) => file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.sql'))
let foundForbidden = false
for (const file of scanFiles) {
  const text = fs.readFileSync(file, 'utf8')
  for (const pattern of forbiddenPatterns) {
    if (pattern.test(text) && !file.endsWith('verify-carelink-ops-dispatch-control.mjs')) {
      if (pattern.source === 'seed' && file.endsWith('.sql') && text.includes('No seed')) continue
      console.error(`Forbidden static/demo pattern ${pattern} found in ${file}`)
      foundForbidden = true
    }
  }
}
if (foundForbidden) process.exit(1)
console.log('CareLink Ops Dispatch Control files are present and pass no-demo static scan.')
