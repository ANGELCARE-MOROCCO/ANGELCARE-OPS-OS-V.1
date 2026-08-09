import fs from 'node:fs'

const files = [
  'components/traininghub/internal/PartnerDossierMegaModal.tsx',
  'components/traininghub/internal/TrainingHubCommandCenterDynamicPremium.tsx',
  'app/api/traininghub/internal/partner-dossier/[id]/route.ts',
]

const rows = files.map((file) => ({ file, ok: fs.existsSync(file) }))
console.table(rows)

if (rows.some((row) => !row.ok)) {
  console.error('TrainingHub partner dossier mega modal verification FAILED.')
  process.exit(1)
}

const modal = fs.readFileSync('components/traininghub/internal/PartnerDossierMegaModal.tsx', 'utf8')
const main = fs.readFileSync('components/traininghub/internal/TrainingHubCommandCenterDynamicPremium.tsx', 'utf8')
const api = fs.readFileSync('app/api/traininghub/internal/partner-dossier/[id]/route.ts', 'utf8')

const modalRequired = [
  'DOSSIER PARTENAIRE · TRAININGHUB 360',
  'Vue 360',
  'Commercial & revenu',
  'Delivery formations',
  'Équipe & accès',
  'Preuves & certificats',
  'Demandes & SLA',
  'Plan & monétisation',
  'Journal',
  'subOverlay',
  'ActionForm',
]

const apiRequired = [
  'create_offer',
  'convert_offer',
  'plan_session',
  'validate_attendance',
  'issue_certificates',
  'publish_document',
  'create_request',
  'publish_notification',
  'update_partner',
]

const missing = [
  ...modalRequired.filter((item) => !modal.includes(item)).map((item) => `modal:${item}`),
  ...apiRequired.filter((item) => !api.includes(item)).map((item) => `api:${item}`),
  !main.includes('PartnerDossierMegaModal') ? 'main import/render PartnerDossierMegaModal' : '',
].filter(Boolean)

if (missing.length) {
  console.error('Missing mega dossier elements:', missing)
  process.exit(1)
}

console.log('TrainingHub partner dossier mega modal verification PASSED.')
