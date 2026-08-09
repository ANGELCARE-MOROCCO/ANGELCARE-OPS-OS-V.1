import fs from 'node:fs'

const file = 'components/traininghub/internal/TrainingHubPartnersPortfolioProduction.tsx'
if (!fs.existsSync(file)) {
  console.error('Missing file:', file)
  process.exit(1)
}

const source = fs.readFileSync(file, 'utf8')
const required = [
  'const avatarBadge: CSSProperties',
  'const tableCellStack: CSSProperties',
  'const tablePrimaryText: CSSProperties',
  'const ownerChip: CSSProperties',
  "gridTemplateColumns: '270px 104px 156px 188px 124px 168px 132px 144px 148px 132px 124px 114px 226px'",
  'participant(s)',
  'responsable partenaire',
]

for (const marker of required) {
  if (!source.includes(marker)) {
    console.error('Missing marker:', marker)
    process.exit(1)
  }
}

console.log('TrainingHub partners table visual fix verification PASSED.')
