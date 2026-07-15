import fs from 'node:fs'

const required = [
  'app/traininghub/page.tsx',
  'components/traininghub/internal/TrainingHubCommandCenterPremiumProduction.tsx',
  'app/api/traininghub/internal/command-center/route.ts',
]

const rows = required.map((file) => ({ file, ok: fs.existsSync(file) }))
console.table(rows)

const missing = rows.filter((row) => !row.ok)
if (missing.length) {
  console.error('TrainingHub Command Center premium verification FAILED.')
  process.exit(1)
}

const component = fs.readFileSync('components/traininghub/internal/TrainingHubCommandCenterPremiumProduction.tsx', 'utf8')
const concepts = [
  'Pilotez vos partenaires',
  'Score de santé globale',
  'Chaîne opérationnelle',
  'Centre de commandement opérationnel',
  'SLA & Risques',
  'État des modules',
  'Alertes prioritaires',
  'Actions recommandées',
]

const missingConcepts = concepts.filter((concept) => !component.includes(concept))
if (missingConcepts.length) {
  console.error('Missing visual concepts:', missingConcepts)
  process.exit(1)
}

console.log('TrainingHub Command Center premium verification PASSED.')
