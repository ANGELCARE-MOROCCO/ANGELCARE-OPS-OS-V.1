import { existsSync, readFileSync } from 'node:fs'

const required = [
  'app/carelink-ops/missions/page.tsx',
  'app/carelink-ops/missions/master-list/page.tsx',
  'app/carelink-ops/missions/timeline/page.tsx',
  'app/carelink-ops/missions/validation/page.tsx',
  'app/carelink-ops/missions/risk-monitoring/page.tsx',
  'app/carelink-ops/missions/field-reports/page.tsx',
  'app/carelink-ops/missions/audit/page.tsx',
  'components/carelink/ops/missions/CareLinkMissionControlCenter.tsx',
  'lib/carelink/ops-missions-types.ts',
  'lib/carelink/ops-missions-repository.ts',
  'app/api/carelink/ops/missions/route.ts',
  'app/api/carelink/ops/missions/actions/route.ts',
  'app/api/carelink/ops/missions/[id]/route.ts',
  'supabase/migrations/20260610_carelink_ops_mission_control_center.sql',
]

const missing = required.filter((file) => !existsSync(file))
if (missing.length) {
  console.error('Missing CareLink Mission Control files:')
  for (const file of missing) console.error(`- ${file}`)
  process.exit(1)
}

const forbidden = [
  'Mary Thompson', 'Alex Rivera', 'Dallas', 'Phoenix', 'CL-2025', 'M-110',
  'Famille', 'Ahmed Ben', 'Fatima Zahra', 'Youssef El', 'sample mission', 'demo mission',
]
const files = required.filter((file) => file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.sql'))
const hits = []
for (const file of files) {
  const text = readFileSync(file, 'utf8')
  for (const phrase of forbidden) if (text.includes(phrase)) hits.push(`${file}: ${phrase}`)
}
if (hits.length) {
  console.error('Forbidden demo/static mission references detected:')
  for (const hit of hits) console.error(`- ${hit}`)
  process.exit(1)
}

console.log('CareLink Mission Control Center targeted files verified successfully.')
