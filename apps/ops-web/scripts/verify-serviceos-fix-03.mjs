import fs from 'fs'
const target = 'components/service-os/ServiceOSPrimitives.tsx'
const required = [
  'ServiceOSHeader',
  'ServiceOSPanel',
  'ServiceOSKpi',
  'StatusBadge',
  'ServiceOSCard',
  'ServiceOSGrid',
  'ServiceOSPill',
  'ServiceOSButton',
  'ServiceOSSection',
  'ServiceOSMetric'
]
if (!fs.existsSync(target)) {
  console.error(`Missing ${target}`)
  process.exit(1)
}
const content = fs.readFileSync(target, 'utf8')
const missing = required.filter(name => !content.includes(`export function ${name}`))
if (missing.length) {
  console.error('Missing exports:', missing.join(', '))
  process.exit(1)
}
console.log('ServiceOS Fix 03 OK: primitive exports are present.')
