import fs from 'node:fs'
const required=['lib/service-os/commercial-engine.ts','app/(protected)/services/commercial/page.tsx','app/(protected)/services/pricing-engine/page.tsx','app/(protected)/services/subscriptions/page.tsx','app/api/service-os/commercial/route.ts']
const missing=required.filter(f=>!fs.existsSync(f)); if(missing.length){console.error('Missing ServiceOS Phase3 files:',missing); process.exit(1)} console.log('ServiceOS Phase3 files present.')
