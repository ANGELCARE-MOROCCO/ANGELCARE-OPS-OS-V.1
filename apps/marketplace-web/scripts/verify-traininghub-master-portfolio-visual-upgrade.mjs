import fs from 'node:fs'
const file = 'components/traininghub/internal/TrainingHubCommandCenterDynamicPremium.tsx'
const content = fs.readFileSync(file, 'utf8')
const checks = [
  ['4 cards grid mode', content.includes("gridTemplateColumns: 'repeat(4, minmax(0, 1fr))'")],
  ['Premium card accent', content.includes('directoryCardAccent')],
  ['Gateway body/value styles', content.includes('gatewayBody') && content.includes('gatewayValue')],
  ['Rich card KPI row', content.includes('directoryCardKpiRow')],
  ['Rich meta cards', content.includes('directoryMetaCard')],
  ['List/cards still open dossier', content.includes('DirectoryPartnerRow') && content.includes('DirectoryPartnerCard')],
]
console.table(checks.map(([name, pass]) => ({name, pass})))
if (checks.some(([, pass]) => !pass)) {
  console.error('Verification FAILED')
  process.exit(1)
}
console.log('TrainingHub master portfolio visual upgrade verification PASSED.')
