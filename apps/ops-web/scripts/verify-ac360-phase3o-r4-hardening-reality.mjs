import fs from 'fs'
import path from 'path'

const mustExist = [
  'components/ac360/customer/direction/Ac360DirectionCockpitPage.tsx',
  'app/(protected)/angelcare-360/page.tsx',
  'app/(protected)/angelcare-360/customer/page.tsx',
  'app/(protected)/angelcare-360/customer/cockpit-direction/page.tsx',
  'app/(protected)/angelcare-360/customer/cockpit-direction/[view]/page.tsx',
  'app/api/ac360/customer/cockpit-direction/route.ts',
  'lib/ac360/customer-direction-cockpit-production.ts',
]

const fail = (msg) => { console.error(`❌ ${msg}`); process.exit(1) }
for (const file of mustExist) {
  if (!fs.existsSync(file)) fail(`Missing required file: ${file}`)
}

const page = fs.readFileSync('components/ac360/customer/direction/Ac360DirectionCockpitPage.tsx', 'utf8')
const rootRoute = fs.readFileSync('app/(protected)/angelcare-360/page.tsx', 'utf8')
const customerRoute = fs.readFileSync('app/(protected)/angelcare-360/customer/page.tsx', 'utf8')

for (const [label, source] of [['root route', rootRoute], ['customer route', customerRoute]]) {
  if (!source.includes('Ac360DirectionCockpitPage')) fail(`${label} does not render Ac360DirectionCockpitPage`)
  if (source.includes('redirect(') || source.includes('Ac360CustomerExperienceShell')) fail(`${label} still redirects or renders legacy shared shell`)
}

const requiredStrings = [
  'Zero static action policy · Phase 3O-R4',
  'RealityHardeningBar',
  'openDirectionCommand',
  "ac360:direction-command",
  'Scanner les gaps du cockpit',
  'Planifier export de preuve',
  'Confirmer exécution réelle',
  'proofReference',
]
for (const str of requiredStrings) {
  if (!page.includes(str)) fail(`Missing hardening marker: ${str}`)
}

const forbiddenVisibleLegacy = [
  'Le cockpit direction devient vivant',
  'Phase 3B · Cockpit live',
  'Phase 3J · Centre de commande intelligent',
  'Runtime partiel',
]
for (const str of forbiddenVisibleLegacy) {
  if (page.includes(str)) fail(`Legacy visible text remains inside direction cockpit page: ${str}`)
}

const buttonCount = (page.match(/<button\b/g) || []).length
const onClickCount = (page.match(/onClick=/g) || []).length
if (buttonCount < 10) fail(`Suspiciously low button count: ${buttonCount}`)
if (onClickCount < 12) fail(`Not enough command handlers detected: ${onClickCount}`)

const routeFiles = [
  'app/(protected)/angelcare-360/page.tsx',
  'app/(protected)/angelcare-360/customer/page.tsx',
  'app/(protected)/angelcare-360/customer/cockpit-direction/page.tsx',
]
for (const file of routeFiles) {
  const source = fs.readFileSync(file, 'utf8')
  if (!source.includes("initialView=\"synthese\"")) fail(`${file} does not force synthese visual cockpit`)
}

console.log('✅ AC360 Phase 3O-R4 hardening reality verification passed.')
console.log('✅ Root/customer/cockpit routes render the premium Direction Cockpit directly.')
console.log('✅ Zero-static-action layer, global command event bus, proof modal and hardening commands detected.')
