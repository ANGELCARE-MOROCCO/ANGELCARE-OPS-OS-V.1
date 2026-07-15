import fs from 'node:fs'

const file = 'components/traininghub/commercial/TrainingHubCommercialCommandCenter.tsx'
const text = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : ''

const checks = [
  ['commercial command center exists', fs.existsSync(file)],
  ['sidebar route helper exists', text.includes('function trainingHubSidebarHref')],
  ['sidebar uses anchor links', text.includes('<a') && text.includes('href={href}')],
  ['commercial link route exists in map', text.includes("'Commercial': '/traininghub/commercial'")],
  ['billing route exists in map', text.includes("'Facturation': '/traininghub/commercial?view=billing'")],
  ['credits route exists in map', text.includes("'Crédits formation': '/traininghub/commercial?view=credits'")],
  ['link styles exist', text.includes('sideItemLinkStyle') && text.includes('sideItemActiveLinkStyle')],
  ['old dead div item removed', !text.includes('<div key={item} style={item === active ? sideItemActiveStyle : sideItemStyle}>')],
]

console.table(checks.map(([name, pass]) => ({ name, pass })))

if (checks.some(([, pass]) => !pass)) {
  console.error('TrainingHub commercial sidebar navigation fix verification FAILED.')
  process.exit(1)
}

console.log('TrainingHub commercial sidebar navigation fix verification PASSED.')
