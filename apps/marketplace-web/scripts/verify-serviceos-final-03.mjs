import fs from 'fs'
const required = ['lib/service-os/production/pricing-engine.ts','lib/service-os/production/matching-engine.ts','lib/service-os/production/workflow-engine.ts','app/api/service-os/match/route.ts','app/api/service-os/price/route.ts']
const missing = required.filter(f => !fs.existsSync(f)); if (missing.length) { console.error('Missing Final 03 files:', missing); process.exit(1) } console.log('✅ ServiceOS Final 03 engines installed')
