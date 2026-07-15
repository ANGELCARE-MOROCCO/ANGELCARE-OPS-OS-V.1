const fs = require('fs')
const path = 'app/(protected)/services/pricing-engine/page.tsx'
if (!fs.existsSync(path)) throw new Error(`Missing ${path}`)
const src = fs.readFileSync(path, 'utf8')
for (const token of ["complexity: 'high'", 'type PriceModifier', 'calculateServicePrice']) {
  if (!src.includes(token)) throw new Error(`Missing expected token: ${token}`)
}
console.log('✅ SERVICEOS FIX 06 OK — pricing-engine page uses accepted complexity scale and typed modifiers.')
