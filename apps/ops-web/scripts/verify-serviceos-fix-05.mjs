const fs = require('fs')
const path = require('path')
const target = path.join(process.cwd(), 'lib/service-os/index.ts')
if (!fs.existsSync(target)) {
  console.error('Missing lib/service-os/index.ts')
  process.exit(1)
}
const text = fs.readFileSync(target, 'utf8')
const required = ['calculateServicePrice', 'getServiceBlueprints', 'getServiceModules', 'getServiceRules', 'getCityDeployments', 'getServiceMissions']
const missing = required.filter((name) => !text.includes(`function ${name}`) && !text.includes(`const ${name}`))
if (missing.length) {
  console.error('Missing required exports:', missing.join(', '))
  process.exit(1)
}
console.log('✅ SERVICEOS FIX 05 OK — lib/service-os barrel engine exists and exports required ServiceOS functions.')
