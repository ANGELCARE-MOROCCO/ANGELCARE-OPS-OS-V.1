import fs from 'node:fs'

const file = 'components/traininghub/internal/TrainingHubCommandCenterDynamicPremium.tsx'
if (!fs.existsSync(file)) {
  console.error(`Missing ${file}`)
  process.exit(1)
}

const content = fs.readFileSync(file, 'utf8')

const checks = [
  ['new forced card function exists', content.includes('function DirectoryPartnerCardVisualForce')],
  ['partner JSX renders forced card', content.includes('<DirectoryPartnerCardVisualForce')],
  ['4 cards per row', content.includes("gridTemplateColumns: 'repeat(4, minmax(280px, 1fr))'")],
  ['visual styles exist', content.includes('const acForcePartnerCard: CSSProperties')],
  ['colored tags exist', content.includes('acForceRiskWatch') && content.includes('acForceRiskSafe') && content.includes('acForceRiskHigh')],
  ['labels separated from values', content.includes('acForceInfoItem')],
  ['card opens dossier', content.includes('onClick={onOpen}')],
]

console.table(checks.map(([name, pass]) => ({ name, pass })))

if (checks.some(([, pass]) => !pass)) {
  console.error('TrainingHub forced partner cards visual tags verification FAILED.')
  process.exit(1)
}

console.log('TrainingHub forced partner cards visual tags verification PASSED.')
