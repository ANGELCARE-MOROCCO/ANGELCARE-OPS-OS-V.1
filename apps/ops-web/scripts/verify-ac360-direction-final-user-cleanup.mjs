import fs from 'node:fs'
import path from 'node:path'

const component = path.join(process.cwd(), 'components/ac360/customer/direction/Ac360DirectionCockpitPage.tsx')
if (!fs.existsSync(component)) {
  console.error('❌ Missing Ac360DirectionCockpitPage.tsx')
  process.exit(1)
}
const source = fs.readFileSync(component, 'utf8')
const forbiddenVisible = [
  'SQL requis',
  'Persisté SQL',
  'Migration SQL',
  'Supabase',
  'Zero static action policy',
  'Phase 3O-R4',
  'Phase 3O-R3',
  'Runtime réel AC360',
  'pré-vol AC360',
  'Pré-vol AC360',
  'CRUD, décisions',
  'fallback protégé',
  'persistance SQL',
  'Résultat AC360 reçu',
  'Erreur runtime AC360',
  'Exécution en cours…' // legacy modal wording; should now be Traitement or Résultat reçu
]
const failures = forbiddenVisible.filter((term) => source.includes(term))
if (failures.length) {
  console.error('❌ Developer-facing visible wording still present:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}
const required = [
  'État opérationnel du cockpit',
  'Pilotage direction : décisions, risques, rapports, preuves et gouvernance',
  'Compte prêt',
  'Configuration à finaliser',
  'Exécution sécurisée',
  'Vérification avant exécution',
  'Résumé de l’action',
  'Activation finale du compte à compléter',
]
const missing = required.filter((term) => !source.includes(term))
if (missing.length) {
  console.error('❌ Required customer-facing wording missing:')
  for (const item of missing) console.error(`- ${item}`)
  process.exit(1)
}
console.log('✅ AC360 Direction final-user cleanup verified: no SQL/Supabase/phase/runtime developer noise in visible cockpit wording.')
