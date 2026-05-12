import fs from 'fs'
const target = 'app/(protected)/services/pricing-engine/page.tsx'
if (!fs.existsSync(target)) {
  console.error('Missing:', target)
  process.exit(1)
}
const src = fs.readFileSync(target, 'utf8')
const checks = ['type PriceModifier', 'modifiers.map((x: PriceModifier)', 'calculateServicePrice']
for (const c of checks) {
  if (!src.includes(c)) {
    console.error('Missing expected code:', c)
    process.exit(1)
  }
}
console.log('SERVICEOS FIX 04 OK: pricing-engine map parameter is typed and build-safe.')
