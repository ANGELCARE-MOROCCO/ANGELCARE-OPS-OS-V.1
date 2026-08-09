import fs from 'node:fs'

const required = [
  'app/traininghub/partners/page.tsx',
  'components/traininghub/internal/TrainingHubPartnersPortfolioProduction.tsx',
  'app/api/traininghub/internal/partners-portfolio/route.ts',
  'app/api/traininghub/internal/partners-portfolio/[id]/route.ts',
  'app/api/traininghub/internal/partners-portfolio/[id]/actions/route.ts',
  'app/api/traininghub/internal/partners-portfolio/export/route.ts',
  'app/api/traininghub/internal/partners-portfolio/import/route.ts',
  'supabase/migrations/20260701102000_traininghub_partners_portfolio_production.sql',
]

const rows = required.map((file) => ({ file, ok: fs.existsSync(file) }))
console.table(rows)

if (rows.some((row) => !row.ok)) {
  console.error('TrainingHub Partners Portfolio production verification FAILED.')
  process.exit(1)
}

const component = fs.readFileSync('components/traininghub/internal/TrainingHubPartnersPortfolioProduction.tsx', 'utf8')
const api = fs.readFileSync('app/api/traininghub/internal/partners-portfolio/route.ts', 'utf8')

for (const concept of [
  'Portefeuille partenaires',
  'Parcours partenaire',
  'MRR partenaires',
  'Health Score global',
  'Créer partenaire',
  'Désactiver temporairement',
  'core_organizations',
  'bill_accounts',
  'bill_proposals',
  'trn_sessions',
]) {
  if (!component.includes(concept) && !api.includes(concept)) {
    console.error('Missing production concept:', concept)
    process.exit(1)
  }
}

console.log('TrainingHub Partners Portfolio production verification PASSED.')
