import fs from 'node:fs'

const files = [
  'components/traininghub/internal/CreatePartnerDossierMegaModal.tsx',
  'components/traininghub/internal/TrainingHubCommandCenterDynamicPremium.tsx',
  'app/api/traininghub/internal/partner-dossier/create/route.ts',
]

const rows = files.map((file) => ({ file, ok: fs.existsSync(file) }))
console.table(rows)

if (rows.some((row) => !row.ok)) {
  console.error('TrainingHub create partner dossier mega modal verification FAILED.')
  process.exit(1)
}

const modal = fs.readFileSync('components/traininghub/internal/CreatePartnerDossierMegaModal.tsx', 'utf8')
const main = fs.readFileSync('components/traininghub/internal/TrainingHubCommandCenterDynamicPremium.tsx', 'utf8')
const api = fs.readFileSync('app/api/traininghub/internal/partner-dossier/create/route.ts', 'utf8')

const modalRequired = [
  'NOUVEAU DOSSIER PARTENAIRE · TRAININGHUB 360',
  'Identité établissement',
  'Contact & accès',
  'Plan & monétisation',
  'Offre initiale',
  'Delivery & session',
  'Preuves & onboarding',
  'Validation dossier',
  'Créer le dossier complet',
]

const apiRequired = [
  'core_organizations',
  'bill_accounts',
  'core_user_profiles',
  'core_memberships',
  'authz_user_role_assignments',
  'bill_proposals',
  'bill_proposal_items',
  'bill_subscriptions',
  'trn_sessions',
  'partner_documents',
  'partner_requests',
  'partner_notifications',
  'createUser',
]

const missing = [
  ...modalRequired.filter((item) => !modal.includes(item)).map((item) => `modal:${item}`),
  ...apiRequired.filter((item) => !api.includes(item)).map((item) => `api:${item}`),
  !main.includes('CreatePartnerDossierMegaModal') ? 'main import/render CreatePartnerDossierMegaModal' : '',
].filter(Boolean)

if (missing.length) {
  console.error('Missing create dossier elements:', missing)
  process.exit(1)
}

console.log('TrainingHub create partner dossier mega modal verification PASSED.')
