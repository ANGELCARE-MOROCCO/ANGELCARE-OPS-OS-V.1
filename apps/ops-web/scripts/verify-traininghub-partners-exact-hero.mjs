import fs from 'node:fs'

const required = [
  'app/traininghub/partners/page.tsx',
  'components/traininghub/partners/TrainingHubPartnersExactHero.tsx',
  'app/api/traininghub/internal/partners-portfolio/route.ts',
]

const rows = required.map((file) => ({ file, ok: fs.existsSync(file) }))
console.table(rows)

if (rows.some((row) => !row.ok)) {
  console.error('TrainingHub partners exact hero verification FAILED.')
  process.exit(1)
}

const component = fs.readFileSync('components/traininghub/partners/TrainingHubPartnersExactHero.tsx', 'utf8')
const requiredText = [
  'Bienvenue Marie',
  'Pilotez vos partenaires, revenus, sessions, certificats, demandes, risques et opérations en temps réel.',
  'Vue d’ensemble',
  'Chiffre d’affaires',
  'Sessions délivrées',
  'Taux de certification',
  'minmax(0,1fr) 720px',
  'Portefeuille partenaires',
]

const missing = requiredText.filter((item) => !component.includes(item))
if (missing.length) {
  console.error('Missing exact hero concepts:', missing)
  process.exit(1)
}

console.log('TrainingHub partners exact hero verification PASSED.')
