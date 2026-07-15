import fs from 'node:fs'

const required = [
  'app/traininghub/page.tsx',
  'components/traininghub/internal/TrainingHubCommandCenterDynamicPremium.tsx',
  'app/api/traininghub/internal/command-center/route.ts',
]

const rows = required.map((file) => ({ file, ok: fs.existsSync(file) }))
console.table(rows)

if (rows.some((row) => !row.ok)) {
  console.error('TrainingHub dynamic premium command center verification FAILED.')
  process.exit(1)
}

const component = fs.readFileSync('components/traininghub/internal/TrainingHubCommandCenterDynamicPremium.tsx', 'utf8')
const requiredText = [
  'Command Experience',
  'COMMAND EXPERIENCE • LIVE PORTFOLIO',
  'Ring',
  'PartnerCard',
  'gridTemplateColumns: \\'324px minmax(0,1fr)\\'',
  'Internal Admin OS',
  'Créer partenaire',
  'Ouvrir dossier',
]

const missing = requiredText.filter((item) => !component.includes(item))
if (missing.length) {
  console.error('Missing dynamic premium concepts:', missing)
  process.exit(1)
}

if (component.includes('style={loading}')) {
  console.error('Invalid boolean loading style still present.')
  process.exit(1)
}

console.log('TrainingHub dynamic premium command center verification PASSED.')
