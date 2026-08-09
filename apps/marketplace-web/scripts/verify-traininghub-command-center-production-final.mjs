import fs from 'node:fs'

const required = [
  'app/traininghub/page.tsx',
  'components/traininghub/internal/TrainingHubCommandCenterProductionFinal.tsx',
  'app/api/traininghub/internal/command-center/route.ts',
  'app/api/traininghub/internal/command-center/drilldown/route.ts',
  'app/api/traininghub/internal/command-center/actions/route.ts',
  'app/api/traininghub/internal/command-center/export/route.ts',
  'supabase/migrations/20260701093000_traininghub_command_center_production_actions.sql',
]

const rows = required.map((file) => ({ file, ok: fs.existsSync(file) }))
console.table(rows)

if (rows.some((row) => !row.ok)) {
  console.error('TrainingHub Command Center production final verification FAILED.')
  process.exit(1)
}

const component = fs.readFileSync('components/traininghub/internal/TrainingHubCommandCenterProductionFinal.tsx', 'utf8')
const api = fs.readFileSync('app/api/traininghub/internal/command-center/route.ts', 'utf8')

for (const concept of [
  'Action prioritaire',
  'Drill-down production',
  'Export',
  'Vue d’ensemble réelle',
  'Centre de commandement opérationnel',
  'traininghub_internal_actions',
]) {
  if (!component.includes(concept) && !api.includes(concept)) {
    console.error('Missing production concept:', concept)
    process.exit(1)
  }
}

console.log('TrainingHub Command Center production final verification PASSED.')
