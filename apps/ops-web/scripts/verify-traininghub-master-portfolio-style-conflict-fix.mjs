import fs from 'node:fs'

const file = 'components/traininghub/internal/TrainingHubCommandCenterDynamicPremium.tsx'

if (!fs.existsSync(file)) {
  console.error(`Missing ${file}`)
  process.exit(1)
}

const content = fs.readFileSync(file, 'utf8')
const match = content.match(/const viewSwitchActive: CSSProperties = \{[\s\S]*?\n\}/)

const checks = [
  {
    name: 'viewSwitchActive style exists',
    pass: Boolean(match),
  },
  {
    name: 'viewSwitchActive has no borderColor longhand',
    pass: Boolean(match) && !match[0].includes('borderColor'),
  },
  {
    name: 'viewSwitchActive keeps full active border',
    pass: Boolean(match) && match[0].includes("border: '1px solid #1169ff'"),
  },
  {
    name: 'portfolio visual upgrade still present',
    pass: content.includes('directoryPremiumCard') && content.includes('directoryCardsGrid'),
  },
]

console.table(checks)

if (checks.some((check) => !check.pass)) {
  console.error('TrainingHub master portfolio style conflict fix verification FAILED.')
  process.exit(1)
}

console.log('TrainingHub master portfolio style conflict fix verification PASSED.')
