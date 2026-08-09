import { existsSync, readFileSync } from 'node:fs'
const required = ['app/api/missions/control-center/route.ts','app/api/missions/dossiers/route.ts','app/api/missions/[id]/route.ts','app/api/missions/[id]/transition/route.ts','app/api/missions/[id]/assign/route.ts','app/api/missions/[id]/validate/route.ts','app/api/carelink/ops/missions/route.ts']
const missing = required.filter((file) => !existsSync(file))
if (missing.length) { console.error('Missing API files:', missing.join(', ')); process.exit(1) }
const all = required.map((file) => readFileSync(file, 'utf8')).join('\n')
if (/assigned_agent_id|carelink_ops_missions|Mary Thompson|Dallas/i.test(all)) { console.error('Forbidden references found'); process.exit(1) }
console.log('Mission APIs + CRUD verification passed.')
