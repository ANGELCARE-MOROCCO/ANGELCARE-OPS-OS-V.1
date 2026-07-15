import fs from 'node:fs'
const file = 'components/carelink/ops/missions/CareLinkCreateMissionDossierModal.tsx'
if (!fs.existsSync(file)) throw new Error(`${file} is missing`)
const s = fs.readFileSync(file, 'utf8')
const required = [
  'Service Type',
  'Required Skills / Competencies',
  'Backup caregiver',
  'Linked Sub-Missions / Sessions Preview',
  'Bulk rate for all missions',
  'Separate rate per mission date',
  'Linked Mission / Date',
  'Programs & Activities',
  'No billing columns',
  'MAD (DH)',
  'CareLinkCreateMissionDossierModal',
]
const missing = required.filter((token) => !s.includes(token))
if (missing.length) throw new Error(`Missing expected modal tokens: ${missing.join(', ')}`)
const forbidden = ['assigned_agent_id', 'carelink_ops_missions', 'Mary Thompson', 'Dallas, TX', 'M-110']
const found = forbidden.filter((token) => s.includes(token))
if (found.length) throw new Error(`Forbidden fake/parallel-schema tokens found: ${found.join(', ')}`)
console.log('CareLink Create Mission Dossier enterprise modal verification passed.')
