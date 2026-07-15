import fs from 'node:fs'

const file = 'components/traininghub/internal/TrainingHubCommandCenterPolishedFinal.tsx'

if (!fs.existsSync(file)) {
  console.error(`Missing ${file}`)
  process.exit(1)
}

const content = fs.readFileSync(file, 'utf8')

const checks = [
  {
    name: 'No boolean loading used as style',
    pass: !content.includes('style={loading}>') && !content.includes('style={loading}'),
  },
  {
    name: 'Loading pill style exists',
    pass: content.includes('loadingPillStyle'),
  },
  {
    name: 'Boolean loading state still exists',
    pass: content.includes('const [loading, setLoading]'),
  },
]

console.table(checks)

if (checks.some((check) => !check.pass)) {
  console.error('TrainingHub main loading style runtime fix verification FAILED.')
  process.exit(1)
}

console.log('TrainingHub main loading style runtime fix verification PASSED.')
