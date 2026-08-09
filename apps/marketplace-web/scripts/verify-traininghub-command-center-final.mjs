import fs from 'node:fs'

const required = [
  'app/traininghub/page.tsx',
  'components/traininghub/internal/TrainingHubCommandCenterFinal.tsx',
  'app/api/traininghub/internal/command-center/route.ts',
]

const rows = required.map((file) => ({ file, ok: fs.existsSync(file) }))
console.table(rows)
if (rows.some((row) => !row.ok)) {
  console.error('TrainingHub Command Center final verification FAILED.')
  process.exit(1)
}

const component = fs.readFileSync('components/traininghub/internal/TrainingHubCommandCenterFinal.tsx', 'utf8')
const requiredText = [
  'Pilotez vos partenaires, revenus, sessions, certificats, demandes, risques et opérations en temps réel',
  'Score de santé globale',
  'Chaîne opérationnelle',
  'Portefeuille partenaires — Pipeline',
  'Suivi commercial — Conversion',
  'Planning — Sessions à venir',
  'SLA & Risques',
  'Alertes prioritaires',
  'Actions recommandées',
]
const missing = requiredText.filter((item) => !component.includes(item))
if (missing.length) {
  console.error('Missing final command center sections:', missing)
  process.exit(1)
}
console.log('TrainingHub Command Center FINAL verification PASSED.')
