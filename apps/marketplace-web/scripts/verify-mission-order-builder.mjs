import { existsSync, readFileSync } from 'node:fs'
const required = ['components/carelink/ops/missions/order/MissionOrderBuilder.tsx','lib/missions/mission-order.ts','lib/missions/pdf.ts','app/api/missions/[id]/mission-order/route.ts','app/api/missions/[id]/mission-order/export-pdf/route.ts']
const missing = required.filter((file) => !existsSync(file))
if (missing.length) { console.error('Missing mission order files:', missing.join(', ')); process.exit(1) }
const all = required.map((file) => readFileSync(file, 'utf8')).join('\n')
if (/Mary Thompson|Dallas|M-110|seed|demo/i.test(all)) { console.error('Forbidden demo/static references found'); process.exit(1) }
console.log('Mission Order Builder verification passed.')
