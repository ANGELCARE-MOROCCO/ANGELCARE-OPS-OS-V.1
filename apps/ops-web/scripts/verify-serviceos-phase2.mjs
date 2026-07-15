import fs from 'node:fs'
const required=['lib/service-os/execution-engine.ts','app/(protected)/services/operations/page.tsx','app/(protected)/services/workflows/page.tsx','app/(protected)/services/incidents/page.tsx','app/api/service-os/operations/route.ts']
const missing=required.filter(f=>!fs.existsSync(f)); if(missing.length){console.error('Missing ServiceOS Phase2 files:',missing); process.exit(1)} console.log('ServiceOS Phase2 files present.')
