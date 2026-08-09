import fs from 'fs'
const required = ['lib/service-os/production/route-registry.ts','lib/service-os/production/health-check.ts','app/api/service-os/health/route.ts','scripts/seed-serviceos-production.mjs']
const missing = required.filter(f => !fs.existsSync(f)); if (missing.length) { console.error('Missing Final 05 files:', missing); process.exit(1) } console.log('✅ ServiceOS Final 05 QA launchpad installed')
