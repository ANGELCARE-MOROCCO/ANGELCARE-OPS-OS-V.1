import fs from 'fs'
const required = ['lib/service-os/production/permissions.ts','lib/service-os/production/audit.ts','lib/service-os/production/cross-module-sync.ts','app/api/service-os/readiness/route.ts','database/serviceos/502_serviceos_rls_and_indexes.sql']
const missing = required.filter(f => !fs.existsSync(f)); if (missing.length) { console.error('Missing Final 04 files:', missing); process.exit(1) } console.log('✅ ServiceOS Final 04 permissions/audit/sync installed')
