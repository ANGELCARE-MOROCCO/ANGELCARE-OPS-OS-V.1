import fs from 'node:fs'

const required = [
  'components/carelink/ops/missions/CareLinkCreateMissionDossierModal.tsx',
  'components/carelink/ops/missions/CareLinkMissionControlCenter.tsx',
  'app/api/missions/dossier-options/route.ts',
  'supabase/migrations/20260610_carelink_create_mission_modal_order_rows.sql',
]
let ok = true
for (const file of required) {
  if (!fs.existsSync(file)) {
    console.error(`Missing ${file}`)
    ok = false
  }
}
const center = fs.existsSync(required[1]) ? fs.readFileSync(required[1], 'utf8') : ''
if (!center.includes('CareLinkCreateMissionDossierModal')) {
  console.error('CareLinkMissionControlCenter is not wired to the new modal yet. Run scripts/apply-carelink-create-mission-dossier-modal.sh')
  ok = false
}
const modal = fs.existsSync(required[0]) ? fs.readFileSync(required[0], 'utf8') : ''
for (const forbidden of ['Mary Thompson', 'Dallas', 'M-110', 'assigned_agent_id', 'carelink_ops_missions']) {
  if (modal.includes(forbidden)) {
    console.error(`Forbidden static/parallel schema reference found: ${forbidden}`)
    ok = false
  }
}
if (!ok) process.exit(1)
console.log('CareLink Create Mission Dossier modal package verified.')
