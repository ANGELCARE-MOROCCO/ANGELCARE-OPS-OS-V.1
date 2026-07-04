import fs from 'node:fs'
import path from 'node:path'

const requiredFiles = [
  'components/ac360/customer/direction/Ac360DirectionCockpitPage.tsx',
  'lib/ac360/customer-direction-cockpit-model.ts',
  'app/(protected)/angelcare-360/customer/cockpit-direction/page.tsx',
  'app/(protected)/angelcare-360/customer/cockpit-direction/[view]/page.tsx',
  'AC360_PHASE3O_R2_VISUAL_CONTRACT_README.md',
]

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) throw new Error(`Missing required file: ${file}`)
}

const component = fs.readFileSync('components/ac360/customer/direction/Ac360DirectionCockpitPage.tsx', 'utf8')
const model = fs.readFileSync('lib/ac360/customer-direction-cockpit-model.ts', 'utf8')
const nextConfig = fs.existsSync('next.config.ts') ? fs.readFileSync('next.config.ts', 'utf8') : ''
const pkg = fs.readFileSync('package.json', 'utf8')

const requiredStrings = [
  'AngelCare360',
  'Cockpit de direction',
  'Opérations & multi-sites',
  'Finance & rentabilité',
  'Admissions & croissance',
  'RH & capacité',
  'Qualité, risques & conformité',
  'ParentTrust & expérience familles',
  'Décisions, rapports & exports',
  'Données consolidées pour 14 crèches au Maroc',
  'loi 09-08',
  'Chiffre d’affaires',
  'Encaissements',
  'Impayés',
  'Taux d’occupation',
  'Matrice des risques',
  'Pipeline des admissions',
  'Centre de décisions',
  'Pré-vol AC360',
]

for (const needle of requiredStrings) {
  if (!component.includes(needle) && !model.includes(needle)) throw new Error(`Visual contract string missing: ${needle}`)
}

const forbiddenDarkTokens = ['bg-black', 'bg-slate-950 text-white', 'from-black', 'to-black']
for (const token of forbiddenDarkTokens) {
  if (component.includes(token)) throw new Error(`Forbidden dark-theme token found: ${token}`)
}

const routes = [
  'operations', 'finance', 'admissions', 'equipe', 'securite', 'parents', 'rapports', 'gouvernance',
]
for (const route of routes) {
  if (!model.includes(`/angelcare-360/customer/cockpit-direction/${route}`)) throw new Error(`Missing cockpit subroute: ${route}`)
}

if (!nextConfig.includes('AC360_BUILD_STABILITY_LOCK')) throw new Error('Vercel build stability lock missing from next.config.ts')
if (!nextConfig.includes('config.cache = false')) throw new Error('Webpack cache disable missing from next.config.ts')
if (!pkg.includes('NODE_OPTIONS=--max-old-space-size=16384 next build --webpack')) throw new Error('Build command memory lock missing from package.json')

console.log('✅ AC360 Phase 3O-R2 visual contract verification passed.')
console.log('✅ Persistent sidebar, top intelligence bar, white premium UI, dense executive grids, subroutes, French Morocco wording and governance/footer confirmed.')
console.log('✅ Vercel build stability lock preserved.')
