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
]
const missing = required.filter((file) => !existsSync(file))
if (missing.length) { console.error('Missing UI files:', missing.join(', ')); process.exit(1) }
const src = readFileSync('components/carelink/ops/missions/CareLinkMissionControlCenter.tsx', 'utf8')
if (/Mary Thompson|Dallas|M-110|seed|demo/i.test(src)) { console.error('Forbidden demo/static references found'); process.exit(1) }
console.log('CareLink Ops Mission Control UI verification passed.')
