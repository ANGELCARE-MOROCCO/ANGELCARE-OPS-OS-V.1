import fs from 'node:fs'
const required=['lib/service-os/expansion-engine.ts','app/(protected)/services/expansion/page.tsx','app/(protected)/services/live-ops/page.tsx','app/(protected)/services/capacity/page.tsx','app/api/service-os/expansion/route.ts']
const missing=required.filter(f=>!fs.existsSync(f)); if(missing.length){console.error('Missing ServiceOS Phase4 files:',missing); process.exit(1)} console.log('ServiceOS Phase4 files present.')
