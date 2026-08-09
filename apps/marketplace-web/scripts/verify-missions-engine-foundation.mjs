import { existsSync, readFileSync } from 'node:fs'
const required = [
  'lib/missions/types.ts',
  'lib/missions/repository.ts',
  'lib/missions/dossiers.ts',
  'lib/missions/lifecycle.ts',
  'lib/missions/assignment.ts',
  'lib/missions/service-characteristics.ts',
  'supabase/migrations/20260610_missions_dossier_submissions_upgrade.sql',
]
const missing = required.filter((file) => !existsSync(file))
if (missing.length) {
  console.error('Missing files:', missing.join(', '))
  process.exit(1)
}
const migration = readFileSync('supabase/migrations/20260610_missions_dossier_submissions_upgrade.sql', 'utf8')
if (/assigned_agent_id|carelink_ops_missions|insert\s+into\s+public\.missions/i.test(migration)) {
  console.error('Forbidden duplicate/fake mission schema or seed detected in migration')
  process.exit(1)
}
console.log('Mission engine foundation verification passed.')
