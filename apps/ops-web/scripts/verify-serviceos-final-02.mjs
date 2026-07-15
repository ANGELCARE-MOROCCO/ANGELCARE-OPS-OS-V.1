import fs from 'fs'
const required = ['components/service-os/production/ServiceOSBlueprintForm.tsx','app/(protected)/services/blueprints/new/page.tsx','app/(protected)/services/blueprints/[id]/edit/page.tsx']
const missing = required.filter(f => !fs.existsSync(f))
if (missing.length) { console.error('Missing Final 02 files:', missing); process.exit(1) }
console.log('✅ ServiceOS Final 02 real action UI installed')
