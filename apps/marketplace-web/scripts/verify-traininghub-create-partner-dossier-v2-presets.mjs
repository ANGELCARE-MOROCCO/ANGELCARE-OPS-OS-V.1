import fs from 'node:fs'

const files = [
  'components/traininghub/internal/CreatePartnerDossierMegaModal.tsx',
  'components/traininghub/internal/TrainingHubCommandCenterDynamicPremium.tsx',
  'app/api/traininghub/internal/partner-dossier/create/route.ts',
]

const rows = files.map((file) => ({ file, ok: fs.existsSync(file) }))
console.table(rows)

if (rows.some((row) => !row.ok)) {
  console.error('TrainingHub create partner dossier V2 presets verification FAILED.')
  process.exit(1)
}

const modal = fs.readFileSync('components/traininghub/internal/CreatePartnerDossierMegaModal.tsx', 'utf8')
const main = fs.readFileSync('components/traininghub/internal/TrainingHubCommandCenterDynamicPremium.tsx', 'utf8')
const api = fs.readFileSync('app/api/traininghub/internal/partner-dossier/create/route.ts', 'utf8')

const modalRequired = [
  'Presets préintégrés',
  'Billing & contrôle',
  'Modules activés pour le partenaire',
  'Services facturables préintégrés',
  'Kits de preuves à publier',
  'Modèle de facturation',
  'Politique facture',
  'Renouvellement',
  'Créer wallet crédits',
  'Créer le dossier complet',
]

const apiRequired = [
  'billing',
  'selectedServices',
  'enabledModules',
  'bill_accounts',
  'bill_training_credits',
  'bill_subscriptions',
  'partner_documents',
  'partner_notifications',
  'commission_per_sale: false',
  'tax_vat_collection: false',
]

const missing = [
  ...modalRequired.filter((item) => !modal.includes(item)).map((item) => `modal:${item}`),
  ...apiRequired.filter((item) => !api.includes(item)).map((item) => `api:${item}`),
  !main.includes('CreatePartnerDossierMegaModal') ? 'main import/render CreatePartnerDossierMegaModal' : '',
].filter(Boolean)

if (missing.length) {
  console.error('Missing V2 presets elements:', missing)
  process.exit(1)
}

if (modal.includes('style={eyebrowText}') || modal.includes('style={loading}')) {
  console.error('Potential style shadowing detected.')
  process.exit(1)
}

console.log('TrainingHub create partner dossier V2 presets verification PASSED.')
