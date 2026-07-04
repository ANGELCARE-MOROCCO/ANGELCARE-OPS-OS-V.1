import fs from 'node:fs'

const files = [
  'app/traininghub/partners/page.tsx',
  'components/traininghub/internal/TrainingHubPartnersPortfolioProduction.tsx',
  'app/api/traininghub/internal/partners-portfolio/route.ts',
]

const rows = files.map((file) => ({ file, ok: fs.existsSync(file) }))
console.table(rows)

if (rows.some((row) => !row.ok)) {
  console.error('TrainingHub partners final polish verification FAILED.')
  process.exit(1)
}

const component = fs.readFileSync('components/traininghub/internal/TrainingHubPartnersPortfolioProduction.tsx', 'utf8')
const api = fs.readFileSync('app/api/traininghub/internal/partners-portfolio/route.ts', 'utf8')

for (const concept of [
  'Portefeuille partenaires',
  'Health Score global',
  'Parcours partenaire',
  'MASTER PORTFOLIO',
  'Créer partenaire',
  'readRows',
  'monthTrend',
]) {
  if (!component.includes(concept) && !api.includes(concept)) {
    console.error('Missing final polish concept:', concept)
    process.exit(1)
  }
}

if (api.includes(".order('created_at'")) {
  console.error('Final polish failed: API still orders by created_at and may trigger missing-column warnings.')
  process.exit(1)
}

console.log('TrainingHub partners final polish verification PASSED.')
