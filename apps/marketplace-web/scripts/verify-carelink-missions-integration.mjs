import { existsSync, readFileSync } from 'node:fs'
const required = ['app/carelink/missions/page.tsx','app/carelink/missions/[id]/page.tsx','app/carelink/schedule/page.tsx','components/carelink/mobile/CareLinkMobileMissions.tsx','components/carelink/mobile/CareLinkMobileMissionDetail.tsx','app/api/carelink/missions/route.ts']
const missing = required.filter((file) => !existsSync(file))
if (missing.length) { console.error('Missing CareLink mobile files:', missing.join(', ')); process.exit(1) }
const all = required.map((file) => readFileSync(file, 'utf8')).join('\n')
if (/Mary Thompson|Dallas|M-110|seed|demo|assigned_agent_id|carelink_ops_missions/i.test(all)) { console.error('Forbidden static/duplicate mission references found'); process.exit(1) }
console.log('CareLink mobile missions integration verification passed.')
