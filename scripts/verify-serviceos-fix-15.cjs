const fs = require('fs')
const path = require('path')
const target = path.join(process.cwd(), 'lib/service-os/types.ts')
if (!fs.existsSync(target)) {
  console.error('Missing lib/service-os/types.ts')
  process.exit(1)
}
const content = fs.readFileSync(target, 'utf8')
for (const token of ['ServiceBlueprint', 'ServiceReadinessReport', 'CalculatedServicePrice', 'ServiceModule']) {
  if (!content.includes(token)) {
    console.error(`Missing exported type: ${token}`)
    process.exit(1)
  }
}
console.log('SERVICEOS FIX 15 OK: shared service-os types restored.')
