import fs from 'node:fs'
const required=[
 'app/api/browser-extension/v1/bootstrap/route.ts','app/api/browser-extension/v1/auth/pairing/start/route.ts','app/api/browser-extension/v1/auth/pairing/exchange/route.ts','app/api/browser-extension/v1/auth/refresh/route.ts','app/api/browser-extension/v1/admin/access/route.ts','app/(protected)/opsos/browser-extension/page.tsx','app/(protected)/browser-extension/connect/page.tsx','lib/browser-extension/security.ts','lib/browser-extension/runtime.ts','lib/browser-extension/authorization.ts','app/api/browser-extension/v1/commands/prepare/route.ts','supabase/migrations/20260719_browser_extension_revenue_command_core.sql'
]
const errors=[]; for(const file of required) if(!fs.existsSync(file)) errors.push(`Missing ${file}`)
const migration=fs.readFileSync('supabase/migrations/20260719_browser_extension_revenue_command_core.sql','utf8')
for(const table of ['browser_extension_devices','browser_extension_access_profiles','browser_extension_capability_grants','browser_extension_audit_logs']) if(!migration.includes(table)) errors.push(`Migration missing ${table}`)
const runtime=fs.readFileSync('lib/browser-extension/runtime.ts','utf8'); if(!runtime.includes('accessVersion')) errors.push('Runtime does not enforce access version')
if(errors.length){console.error(errors.join('\n'));process.exit(1)}
console.log('Mega ZIP 1 core verification passed: pairing, gateway, dynamic access, admin and audit foundation present.')
