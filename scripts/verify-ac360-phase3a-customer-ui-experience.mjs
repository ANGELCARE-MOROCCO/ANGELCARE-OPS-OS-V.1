import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const required = [
  'app/(protected)/angelcare-360/customer/page.tsx',
  'app/(protected)/angelcare-360/page.tsx',
  'components/ac360/customer/Ac360CustomerExperienceShell.tsx',
  'lib/ac360/customer-ui-model.ts',
]

const missing = required.filter((file) => !fs.existsSync(path.join(root, file)))
if (missing.length) {
  console.error('Fichiers Phase 3A manquants :', missing.join(', '))
  process.exit(1)
}

const shell = fs.readFileSync(path.join(root, 'components/ac360/customer/Ac360CustomerExperienceShell.tsx'), 'utf8')
const model = fs.readFileSync(path.join(root, 'lib/ac360/customer-ui-model.ts'), 'utf8')
const index = fs.readFileSync(path.join(root, 'app/(protected)/angelcare-360/page.tsx'), 'utf8')
const combined = `${shell}\n${model}`

const requiredFrenchTerms = [
  'Cockpit de Direction',
  'Élèves & Familles',
  'Présence & Opérations du Jour',
  'Finance & Créances',
  'Centre de Communication',
  'Documents, Rapports & Stockage',
  'Tâches, Validations & Workflows',
  'RH, Planning & Congés',
  'Santé, Sécurité & Incidents',
  'Transport & Circuits',
  'Facturation & Growth Menu',
  'Thème blanc',
  'Droits intégrés',
  'Sérénité',
  'crédits',
  'restrictions',
]
const missingFrenchTerms = requiredFrenchTerms.filter((term) => !combined.includes(term))
if (missingFrenchTerms.length) {
  console.error('Phase 3A FR manque des termes natifs français :', missingFrenchTerms.join(', '))
  process.exit(1)
}

const forbiddenEnglishPhrases = [
  'Customer Operating Cockpit',
  'Command search: find student',
  'Global Action',
  'Institution Context',
  'No hard lock',
  'Context Rail',
  'Module health',
  'Billing intelligence',
  'Next best actions',
  'Today’s Executive Brief',
  'Active students',
  'Present today',
  'MAD overdue',
  'Hot admissions leads',
  'Staff gaps',
  'Safety alerts',
  'Recommended: activate',
  'Operational Workspace',
  'Production area for',
  'Command actions',
  'Role-aware customer experience',
  'Different roles see',
  'Module universe',
  'White theme enforced',
  'Backend guarded',
]
const englishHits = forbiddenEnglishPhrases.filter((term) => combined.includes(term))
if (englishHits.length) {
  console.error('Texte anglais client encore présent :', englishHits.join(', '))
  process.exit(1)
}

const moduleMatches = model.match(/key: '/g) || []
if (moduleMatches.length < 20) {
  console.error(`Couverture module insuffisante : ${moduleMatches.length} définitions détectées.`)
  process.exit(1)
}

const forbiddenDark = ['bg-slate-950', 'bg-slate-900', 'bg-black', 'from-slate-950', 'from-slate-900', 'to-black']
const darkHits = forbiddenDark.filter((token) => shell.includes(token))
if (darkHits.length) {
  console.error('Tokens thème sombre interdits détectés :', darkHits.join(', '))
  process.exit(1)
}

if (!index.includes("redirect('/angelcare-360/customer')")) {
  console.error('La route AC360 index ne redirige pas vers le cockpit client.')
  process.exit(1)
}

console.log('✅ AC360 Phase 3A FR native customer-end verification passed.')
console.log('✅ Interface client francisée pour le Maroc : cockpit, navigation, modules, facturation, crédits et restrictions.')
console.log('✅ Thème blanc premium confirmé : aucun token sombre interdit détecté.')
console.log(`✅ Couverture modules client confirmée : ${moduleMatches.length} entrées key détectées.`)
