import { readFileSync, existsSync } from 'node:fs'

const required = [
  'app/(protected)/angelcare-360/page.tsx',
  'app/(protected)/angelcare-360/customer/page.tsx',
  'app/(protected)/angelcare-360/customer/cockpit-direction/page.tsx',
  'components/ac360/customer/direction/Ac360DirectionCockpitPage.tsx',
]

for (const file of required) {
  if (!existsSync(file)) throw new Error(`Missing required file: ${file}`)
}

for (const file of required.slice(0, 2)) {
  const content = readFileSync(file, 'utf8')
  if (!content.includes('Ac360DirectionCockpitPage')) throw new Error(`${file} does not render Ac360DirectionCockpitPage`)
  if (content.includes('redirect(')) throw new Error(`${file} still uses redirect; direct render required to prevent 404 route authority confusion`)
  if (!content.includes('force-dynamic')) throw new Error(`${file} must be force-dynamic`)
}

const cockpit = readFileSync('components/ac360/customer/direction/Ac360DirectionCockpitPage.tsx', 'utf8')
for (const phrase of [
  'Cockpit de direction',
  'Finance & rentabilité',
  'Admissions & croissance',
  'Qualité, risques & conformité',
  'ParentTrust & expérience familles',
]) {
  if (!cockpit.includes(phrase)) throw new Error(`Visual-contract cockpit missing phrase: ${phrase}`)
}

console.log('✅ AC360 cockpit 404 hotfix verification passed.')
console.log('✅ /angelcare-360 and /angelcare-360/customer now directly render the visual-contract Cockpit de Direction instead of redirecting.')
