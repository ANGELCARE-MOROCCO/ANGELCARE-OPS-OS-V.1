import fs from 'node:fs'

const file = 'components/traininghub/partners/TrainingHubPartnersExactHero.tsx'
const ok = fs.existsSync(file)
console.table([{ file, ok }])

if (!ok) {
  console.error('Missing partners component.')
  process.exit(1)
}

const content = fs.readFileSync(file, 'utf8')
const required = [
  'sidebarGroups',
  'Internal Admin OS',
  'Command Center',
  'Dossier partenaire',
  'Crédits formation',
  'Présences',
  'Refresh',
  'Rôles & accès',
  'Production readiness',
  'sidebarFinalActive',
  "gridTemplateColumns: '324px minmax(0,1fr)'",
]

const missing = required.filter((item) => !content.includes(item))
if (missing.length) {
  console.error('Missing final sidebar elements:', missing)
  process.exit(1)
}

console.log('TrainingHub partners final sidebar verification PASSED.')
