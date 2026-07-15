import fs from 'node:fs'

const checks = [
  ['app/(protected)/angelcare-360/customer/page.tsx', "redirect('/angelcare-360/customer/cockpit-direction')"],
  ['app/(protected)/angelcare-360/page.tsx', "redirect('/angelcare-360/customer/cockpit-direction')"],
  ['lib/ac360/customer-ui-model.ts', "routeHint: '/angelcare-360/customer/cockpit-direction'"],
  ['components/ac360/customer/direction/Ac360DirectionCockpitPage.tsx', 'AngelCare360'],
]

const failures = []
for (const [file, needle] of checks) {
  const text = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : ''
  if (!text.includes(needle)) failures.push(`${file} missing ${needle}`)
}

const customerPage = fs.readFileSync('app/(protected)/angelcare-360/customer/page.tsx', 'utf8')
if (customerPage.includes('Ac360CustomerExperienceShell')) failures.push('Customer root still renders old Ac360CustomerExperienceShell')
if (customerPage.includes('Phase 3B') || customerPage.includes('Le cockpit direction devient vivant')) failures.push('Customer root still contains old Phase 3B copy')

if (failures.length) {
  console.error('❌ AC360 cockpit route authority verification failed')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}

console.log('✅ AC360 cockpit route authority verification passed.')
console.log('✅ /angelcare-360 and /angelcare-360/customer now route to the visual-contract Cockpit de Direction.')
console.log('✅ Old Phase 3B shared customer shell is no longer the default cockpit entrypoint.')
