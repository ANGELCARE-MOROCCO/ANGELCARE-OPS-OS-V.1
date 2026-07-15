import fs from 'fs'
const required = ['lib/service-os/production/types.ts','lib/service-os/production/seeds.ts','lib/service-os/production/repository.ts','lib/service-os/production/actions.ts','app/api/service-os/blueprints/route.ts','database/serviceos/501_serviceos_production_schema.sql']
const missing = required.filter(f => !fs.existsSync(f))
if (missing.length) { console.error('Missing ServiceOS Final 01 files:', missing); process.exit(1) }
console.log('✅ ServiceOS Final 01 persistence files are installed')
