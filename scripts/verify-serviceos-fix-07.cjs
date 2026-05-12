const fs = require('fs')
const required = ['app/(protected)/services/pricing-engine/page.tsx']
for (const file of required) {
  if (!fs.existsSync(file)) {
    console.error(`Missing ${file}`)
    process.exit(1)
  }
}
const content = fs.readFileSync('app/(protected)/services/pricing-engine/page.tsx', 'utf8')
if (content.includes('basePrice') || content.includes('urgency:')) {
  console.error('Old pricing arguments still detected')
  process.exit(1)
}
console.log('SERVICEOS_FIX_07 ok: pricing-engine page uses current calculateServicePrice contract.')
