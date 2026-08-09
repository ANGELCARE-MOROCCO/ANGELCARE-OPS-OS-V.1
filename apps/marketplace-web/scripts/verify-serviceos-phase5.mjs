import fs from 'node:fs'
const required=['lib/service-os/ai-strategy-engine.ts','app/(protected)/services/ai-strategy/page.tsx','app/(protected)/services/market-intelligence/page.tsx','app/(protected)/services/ai-matching/page.tsx','app/api/service-os/ai-strategy/route.ts']
const missing=required.filter(f=>!fs.existsSync(f)); if(missing.length){console.error('Missing ServiceOS Phase5 files:',missing); process.exit(1)} console.log('ServiceOS Phase5 files present.')
