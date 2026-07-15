import fs from 'node:fs'

const file = 'components/traininghub/commercial/TrainingHubCommercialCommandCenter.tsx'
const text = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : ''

const checks = [
  ['commercial command center exists', fs.existsSync(file)],
  ['sidebar active link style exists', text.includes('const sideItemActiveLinkStyle')],
  ['active link style does not reference later sideItemActiveStyle', !text.includes('const sideItemActiveLinkStyle: CSSProperties = { ...sideItemActiveStyle')],
  ['sidebar still uses real links', text.includes('<a') && text.includes('href={href}')],
  ['route helper still exists', text.includes('function trainingHubSidebarHref')],
  ['commercial route still mapped', text.includes("'Commercial': '/traininghub/commercial'")],
]

console.table(checks.map(([name, pass]) => ({ name, pass })))

if (checks.some(([, pass]) => !pass)) {
  console.error('TrainingHub commercial sidebar TDZ runtime fix verification FAILED.')
  process.exit(1)
}

console.log('TrainingHub commercial sidebar TDZ runtime fix verification PASSED.')
