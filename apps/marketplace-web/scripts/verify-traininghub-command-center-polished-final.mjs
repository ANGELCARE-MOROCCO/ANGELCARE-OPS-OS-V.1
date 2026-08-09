import fs from 'node:fs'

const required = [
  'app/traininghub/page.tsx',
  'components/traininghub/internal/TrainingHubCommandCenterPolishedFinal.tsx',
  'app/api/traininghub/internal/command-center/route.ts',
]

const rows = required.map((file) => ({ file, ok: fs.existsSync(file) }))
console.table(rows)

if (rows.some((row) => !row.ok)) {
  console.error('TrainingHub Command Center polished final verification FAILED.')
  process.exit(1)
}

const content = fs.readFileSync('components/traininghub/internal/TrainingHubCommandCenterPolishedFinal.tsx', 'utf8')
const requiredText = [
  'Un cockpit propre, clair et utilisable',
  'MASTER PORTFOLIO',
  'PartnerCard',
  'gridTemplateColumns: \\'repeat(auto-fit,minmax(420px,1fr))\\'',
  'TrainingHub Command Center',
]

const missing = requiredText.filter((text) => !content.includes(text))
if (missing.length) {
  console.error('Missing polished final concepts:', missing)
  process.exit(1)
}

console.log('TrainingHub Command Center POLISHED FINAL verification PASSED.')
