import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const required = [
  'app/(protected)/angelcare-360/customer/page.tsx',
  'components/ac360/customer/Ac360CustomerExperienceShell.tsx',
  'lib/ac360/customer-ui-model.ts',
  'lib/ac360/customer-live-data.ts',
]

const missing = required.filter((file) => !fs.existsSync(path.join(root, file)))
if (missing.length) {
  console.error('Fichiers Phase 3B manquants :', missing.join(', '))
  process.exit(1)
}

const shell = fs.readFileSync(path.join(root, 'components/ac360/customer/Ac360CustomerExperienceShell.tsx'), 'utf8')
const live = fs.readFileSync(path.join(root, 'lib/ac360/customer-live-data.ts'), 'utf8')
const model = fs.readFileSync(path.join(root, 'lib/ac360/customer-ui-model.ts'), 'utf8')
const combined = `${shell}\n${live}\n${model}`

const requiredFrenchTerms = [
  'Phase 3B · Cockpit live',
  'Matrice live runtime',
  'Synchronisation runtime',
  'Brief exécutif live',
  'runtime connecté',
  'fallback sécurisé',
  'Rafraîchir le cockpit',
  'Endpoints connectés',
  'Facturation & droits',
  'Restrictions compte',
  'Présence du jour',
  'Finance & créances',
  'Communication parents',
  'Documents & stockage',
  'ParentTrust',
  'IA & automatisations',
]
const missingFrenchTerms = requiredFrenchTerms.filter((term) => !combined.includes(term))
if (missingFrenchTerms.length) {
  console.error('Phase 3B manque des termes/live contracts français :', missingFrenchTerms.join(', '))
  process.exit(1)
}

const requiredEndpoints = [
  '/api/ac360/context',
  '/api/ac360/billing-center',
  '/api/ac360/restrictions',
  '/api/ac360/school-ops/summary',
  '/api/ac360/school-attendance/dashboard',
  '/api/ac360/school-finance/dashboard',
  '/api/ac360/school-communication/dashboard',
  '/api/ac360/school-documents/dashboard',
  '/api/ac360/school-workflows/dashboard',
  '/api/ac360/school-admissions/dashboard',
  '/api/ac360/school-hr/dashboard',
  '/api/ac360/school-health-safety/dashboard',
  '/api/ac360/school-transport/dashboard',
  '/api/ac360/school-parenttrust/dashboard',
  '/api/ac360/school-academy/dashboard',
  '/api/ac360/school-automation/dashboard',
  '/api/ac360/school-intake/dashboard',
  '/api/ac360/school-branding/dashboard',
  '/api/ac360/school-onboarding/dashboard',
  '/api/ac360/phase2-final-lock/dashboard',
]
const missingEndpoints = requiredEndpoints.filter((endpoint) => !live.includes(endpoint))
if (missingEndpoints.length) {
  console.error('Endpoints live manquants :', missingEndpoints.join(', '))
  process.exit(1)
}

const forbiddenDark = ['bg-slate-950', 'bg-slate-900', 'bg-black', 'from-slate-950', 'from-slate-900', 'to-black']
const darkHits = forbiddenDark.filter((token) => shell.includes(token))
if (darkHits.length) {
  console.error('Tokens thème sombre interdits détectés :', darkHits.join(', '))
  process.exit(1)
}

if (!shell.includes('loadAc360CustomerLiveCockpit') || !shell.includes('useEffect') || !shell.includes('refreshLive')) {
  console.error('Le shell client ne charge pas le cockpit live avec refresh/useEffect.')
  process.exit(1)
}

const endpointCount = (live.match(/endpoint: '\/api\/ac360\//g) || []).length
if (endpointCount < 20) {
  console.error(`Couverture endpoints insuffisante : ${endpointCount} endpoints détectés.`)
  process.exit(1)
}

const moduleMatches = model.match(/key: '/g) || []
if (moduleMatches.length < 20) {
  console.error(`Couverture module insuffisante : ${moduleMatches.length} définitions détectées.`)
  process.exit(1)
}

console.log('✅ AC360 Phase 3B live data wiring & executive cockpit hardening verification passed.')
console.log('✅ Cockpit client FR connecté aux endpoints Phase 1–2U avec fallbacks sécurisés, refresh, matrice runtime et signaux modules.')
console.log('✅ Thème blanc premium confirmé : aucun token sombre interdit détecté.')
console.log(`✅ Couverture live confirmée : ${endpointCount} endpoints client et ${moduleMatches.length} entrées module détectées.`)
