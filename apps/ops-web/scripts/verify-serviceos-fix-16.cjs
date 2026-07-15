const fs = require('fs')
const path = require('path')
const target = path.join(process.cwd(), 'lib/service-os/types.ts')
if (!fs.existsSync(target)) {
  console.error('Missing lib/service-os/types.ts')
  process.exit(1)
}
const src = fs.readFileSync(target, 'utf8')
const required = ['marketSegment', 'ServiceBlueprint', 'PricingResult', 'CalculatedServicePrice', 'CityDeployment', 'ServiceMission']
const missing = required.filter((token) => !src.includes(token))
if (missing.length) {
  console.error('ServiceOS types contract is missing:', missing.join(', '))
  process.exit(1)
}
console.log('✅ ServiceOS fix 16 verified: enterprise compatibility types are present.')
